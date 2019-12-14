require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const MongoClient = require('mongodb').MongoClient;
const aws = require('aws-sdk');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const request = require('request');
const multer = require('multer');
const fs = require('fs');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');

const db = require('./dbutil');

let config;
if (fs.existsSync(__dirname + '/config(full).js')) {
	config = require(__dirname + '/config(full)');
	config.ssl = {
		 ca: fs.readFileSync(config.mysql.cacert)
	};
} else {
	console.info('using env');
	config = {
        mysql: {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'myApp',
            connectionLimit: 4,
            ssl: {
                ca: process.env.DB_CA
            },
            sessionSecret: process.env.sessionSecret
        },
        s3: {
            accessKey: process.env.accessKey,
            secret: process.env.secret
        },
        mongodb: {
            url: process.env.url
        }
	};
}

const { loadConfig, testConnections } = require('./initdb')
const conns = loadConfig(config);
const PORT = parseInt(process.argv[2] || process.env.APP_PORT || process.env.PORT) || 3000;
const fileUpload = multer({ dest: __dirname + '/tmp' });
const imageType = require('image-type');

// SQL
// authentication
const FIND_USER = 'select count(*) as user_count from users where username = ? and password = sha2(?, 256)';
const GET_USER_DETAILS = 'select username, email, avatar from users where username = ?';
const GET_ALL_ENTRIES = 'select * from entries';

const findUser = db.mkQueryFromPool(db.mkQuery(FIND_USER), conns.mysql);
const getUserDetails = db.mkQueryFromPool(db.mkQuery(GET_USER_DETAILS), conns.mysql);
const getAllEntries = db.mkQueryFromPool(db.mkQuery(GET_ALL_ENTRIES), conns.mysql);
const authenticateUser = (param) => {
    return (
        findUser(param)
            .then(result => (result.length && result[0].user_count > 0))
    )
}
// add user
const INSERT_USER = 'insert into users (username, password, email, avatar) values (?, sha2(?, 256), ?, ?)';
const insertUser = db.mkQuery(INSERT_USER);

// add category
const INSERT_CATEGORY = 'insert into categories (catId, category, colorCode, photo) values (?, ?, ?, ?)';
const insertCategory = db.mkQuery(INSERT_CATEGORY);

// get category
const FIND_CATEGORY = 'select * from categories';
const findCategory = db.mkQueryFromPool(db.mkQuery(FIND_CATEGORY), conns.mysql);

// add entry
const FIND_CATID = 'select catId from categories where category = ?';
const INSERT_ENTRY = 'insert into entries (photo, title, catId, username) values (?, ?, ?, ?)';

const findCatId = db.mkQuery(FIND_CATID);
const insertEntry = db.mkQuery(INSERT_ENTRY);

// get entries
const FIND_CATID1 = 'select catId from categories where category = ?';
const findCatId1 = db.mkQueryFromPool(db.mkQuery(FIND_CATID1), conns.mysql);
const FIND_ENTRIES = 'select * from entries where catId = ?'
const findEntries = db.mkQueryFromPool(db.mkQuery(FIND_ENTRIES), conns.mysql);

// get entry
const GET_ENTRY = 'select * from entries where entryId = ?';
const getEntry = db.mkQueryFromPool(db.mkQuery(GET_ENTRY), conns.mysql);
const FIND_CATEGORY_BY_ENTRY_ID = 'select category from categories where catId = (select catId from entries where entryId = ?)';
const findCategorybyEntryId= db.mkQueryFromPool(db.mkQuery(FIND_CATEGORY_BY_ENTRY_ID), conns.mysql);

// edit entry
const UPDATE_ENTRY_BY_ENTRYID = 'update entries set photo = ?, title = ?, catId = ?, username = ? where entryId = ?';
const updateEntryByEntryId = db.mkQuery(UPDATE_ENTRY_BY_ENTRYID);

// delete entry
const INSERT_DELETED_ENTRY = 'insert into deleted_entries (photo, title, catId, username) values (?, ?, ?, ?)';
const insertDeletedEntry = db.mkQuery(INSERT_DELETED_ENTRY);
const DELETE_ENTRY = 'delete from entries where entryId = ?';
const deleteEntry = db.mkQuery(DELETE_ENTRY);

// user contribution
const ENTRY_COUNT = 'select count(*) as count, username from entries group by username order by count desc';
const entryCount = db.mkQueryFromPool(db.mkQuery(ENTRY_COUNT), conns.mysql);

// Load passport and LocalStrategy
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

passport.use(
    new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
        },
        (username, password, done) => {
            authenticateUser([ username, password ])
                .then(result => {
                    if (result)
                        return (done(null, username))
                    done(null, false);
                })
        }
    )
);

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json({  }));
app.use(cors());
app.use(morgan('tiny'));
app.use(passport.initialize())

app.get('/api/status/:code',
        (req, resp) => {
            resp.status(parseInt(req.params.code)).json({ message: 'incorrect login' })
        }
)

app.get('/api/home',
    (req, resp, next) => {
        const authorization = req.get('Authorization'); // http header
        if (!(authorization && authorization.startsWith('Bearer ')))
            return resp.status(403).json({ message: 'not authorized' })

        const tokenStr = authorization.substring('Bearer '.length)
        conns.mongodb.db('myApp').collection('jwt_tokens').find({jwt:tokenStr})
            .toArray()
            .then(result => {
                console.info('found token')
                if (result.length) {
                    req.jwt = result[0].token;
                    return next()
                }
                 
            })
        try {
            req.jwt = jwt.verify(tokenStr, config.mysql.sessionSecret);
            conns.mongodb.db('myApp').collection('jwt_tokens').insertOne(
                {
                    name: req.jwt.sub,
                    jwt: tokenStr,
                    token: req.jwt
                }
            )
            next()
        } catch (e) {
            return resp.status(401).json({ message: 'invalid token' })
        }
    },
    (req, resp) => {
        console.info('token: ', req.jwt);
        getAllEntries()
            .then(result => {
                resp.status(200).json(result);
            })
    }
)

app.post('/api/authenticate', 
    passport.authenticate('local', {
        failureRedirect: '/api/status/401',
        session: false
    }),
    (req, resp) => {
        // issue the JWT
        getUserDetails([ req.user ])
            .then(result => {
                const d = new Date()
                const rec = result[0];
                const token = jwt.sign({
                    sub: rec.username,
                    iss: 'myApp',
                    iat: d.getTime()/1000,
                    // 15 mins
                    exp: (d.getTime()/1000) + (60 * 15),
                    data: {
                        email: rec.email,
                        avatar: rec.avatar
                    }
                }, config.mysql.sessionSecret)
                resp.status(200).json({ token_type: 'Bearer', access_token: token })
            })
    }
)

// Configure Routes
// get newsSource
app.get('/api/newsSource', (req, resp) => { 
    const options = {
        url: process.env.API_URL,
        qs: {
            'language': 'en',
            'apiKey': process.env.API_KEY
        }
    };
    console.log('Options:', options);

    request(options, (error, response, body)=>{
        if (!error && response.statusCode == 200) { 
            const results = JSON.parse(body)['sources'];
            const filtered = results.map(v => {
                const filter = {
                    id: v.id,
                    name: v.name,
                    description: v.description,
                    url: v.url,
                    category: v.category,
                    language: v.language,
                    country: v.country,

                };
                return filter;
            });
            resp.status(200).type('application/json')
            .json({
                data: filtered,
                timestamp: new Date().getTime()
            });
        } else {
            const nullResponse = {
                data: [],
                timestamp: new Date().getTime()
            }
            resp.statusCode(500).type('application/json')
                .json(nullResponse);
        }
    });
})

// get newsArticle
app.get('/api/newsArticles', (req, resp) => { 
    const options = {
        url: process.env.API_URL1,
        qs: {
            'sources': 'techcrunch',
            'apiKey': process.env.API_KEY
        }
    };
    console.log('Options:', options);

    request(options, (error, response, body)=>{
        if (!error && response.statusCode == 200) { 
            const results = JSON.parse(body)['articles'];
            const filtered = results.map(v => {
                const filter = {
                    source: v.source.name,
                    id: v.source.id,
                    title: v.title,
                    description: v.description,
                    urlToImage: v.urlToImage,
                    url: v.url,
                    publishedAt: v.publishedAt,
                    content: v.content
                };
                return filter;
            });
            resp.status(200).type('application/json')
            .json({
                data: filtered,
                timestamp: new Date().getTime()
            });
        } else {
            const nullResponse = {
                data: [],
                timestamp: new Date().getTime()
            }
            resp.statusCode(500).type('application/json')
                .json(nullResponse);
        }
    });
})

// get newsArticleById
app.get('/api/newsArticleById', (req, resp) => { 
    const source = req.query.source
    const options = {
        url: process.env.API_URL1,
        qs: {
            'sources': source,
            'apiKey': process.env.API_KEY
        }
    };
    console.log('Options:', options);

    request(options, (error, response, body)=>{
        if (!error && response.statusCode == 200) { 
            const results = JSON.parse(body)['articles'];
            const filtered = results.map(v => {
                const filter = {
                    source: v.source.name,
                    id: v.source.id,
                    title: v.title,
                    description: v.description,
                    urlToImage: v.urlToImage,
                    url: v.url,
                    publishedAt: v.publishedAt,
                    content: v.content
                };
                return filter;
            });
            resp.status(200).type('application/json')
            .json({
                data: filtered,
                timestamp: new Date().getTime()
            });
        } else {
            const nullResponse = {
                data: [],
                timestamp: new Date().getTime()
            }
            resp.statusCode(500).type('application/json')
                .json(nullResponse);
        }
    });
})

// add User
app.post('/api/user', fileUpload.single('photo'),
    (req, resp, next) => {
        // input type=<not file>
        console.info('req.body: ', req.body);
        console.info('req.file: ', req.file);
        
        conns.mysql.getConnection(
            (err, conn) => {
                if (err){
                    return resp.status(500).type('application/json').json({err});
                }
                
                db.startTransaction(conn)
                .then(
                    status => {
                        if (typeof(req.file) != 'undefined') {
                            const params = [
                                req.body.username,
                                req.body.password,
                                req.body.email,
                                req.file.filename
                            ]
                            console.info('sql insert_user params: ', params);
                            return (insertUser({connection:status.connection, params: params}));
                        }
                        else {
                            const params = [
                                req.body.username,
                                req.body.password,
                                req.body.email,
                                'nothing'
                            ]
                            console.info('sql insert_user params: ', params);
                            return (insertUser({connection:status.connection, params: params}));
                        }
                    }
                )
                .then(db.commit, db.rollback) // success, fail (or .catch)
                .then(status => 
                    new Promise(
                        (resolve, reject) => {
                            if (typeof(req.file) == 'undefined')
                                return resp.status(201).type('application/json').json({ message: 'no file given' })
                            if (err) {
                                return resp.status(400).type('application/json').json({ error })
                            }
                            console.log('file ...')
                            fs.readFile(req.file.path,(err, imgFile) => {
                                if (err)
                                    return reject({connection: status.connection, error: err})
                                const params = {
                                    Bucket: 'belloz', Key: `myApp/${req.file.filename}`,  // post photo on DO spaces 
                                    Body: imgFile, ContentType: req.file.mimetype,
                                    ContentLength:  req.file.size, ACL: 'public-read'
                                }
                                conns.s3.putObject(params, 
                                    (error, result) => {
                                        if (error)
                                            return reject({ connection: status.connection, error })
                                        resolve({ connection: status.connection, result })
                                    }
                                )
                            })
                        }
                    )
                )
                .then(
                    (status)=>{
                        return new Promise(
                            (resolve, reject) =>{
                                if (typeof(req.file) !== 'undefined') {
                                    console.log('file ...');    
                                    fs.unlink(req.file.path, () =>{
                                        resp.status(201);
                                        resp.format({ 	
                                            'application/json': ()=>{
                                                console.log("returning json");
                                                resp.json({added_category: req.body.category});
                                                
                                            }, 				
                                            'text/html': ()=>{
                                                console.log("returning html");
                                                resp.type('text/plain').send(`added_category: ${req.body.category}`);
                                            }
                                        })
                                        resolve;
                                    })
                                } 
                                console.log('file ...3')
                            }
                        )
                    },
                    (status)=>{ 
                        resp.status(400).type('text/plain').send(`Error ${status.error}`);
                        
                    }
                )
                .finally(()=>conn.release);
            }
        )
    }
)

// add Category
app.post('/api/category', fileUpload.single('photo'),
   (req,resp)=>{  
           console.info('req.body: ', req.body);
           console.info('req.file: ', req.file);
           conns.mysql.getConnection(
            (err, conn) => {
                if (err){
                    return resp.status(500).type('text/plain').send(`Error ${err}`);
                }
                
                db.startTransaction(conn)
                .then(
                    status => {
                        if (typeof(req.file) !== 'undefined') {
                            const params = [
                                uuid().substring(0,8),
                                req.body.category,
                                req.body.colorCode,
                                req.file.filename
                            ]
                            console.info('sql insert_category params: ', params);
                            return (insertCategory({connection:status.connection, params: params}));
                        }
                        else {
                            const params = [
                            uuid().substring(0,8),
                            req.body.category,
                            req.body.colorCode,
                            'nothing'
                            ]
                            console.info('sql insert_category params: ', params);
                            return (insertCategory({connection:status.connection, params: params}));
                        }
                    }
                )
                .then(db.commit, db.rollback) // success, fail (or .catch)
                .then(status => 
                    new Promise(
                        (resolve, reject) => {
                            if (typeof(req.file) == 'undefined')
                                return resp.status(201).type('application/json').json({ message: 'no file given' })
                            if (err) {
                                return resp.status(400).type('application/json').json({ error })
                            }
                            console.log('file ...')
                            fs.readFile(req.file.path,(err, imgFile) => {
                                if (err)
                                    return reject({connection: status.connection, error: err})
                                const params = {
                                    Bucket: 'belloz', Key: `myApp/${req.file.filename}`,  // post photo on DO spaces 
                                    Body: imgFile, ContentType: req.file.mimetype,
                                    ContentLength:  req.file.size, ACL: 'public-read'
                                }
                                conns.s3.putObject(params, 
                                    (error, result) => {
                                        if (error)
                                            return reject({ connection: status.connection, error })
                                        resolve({ connection: status.connection, result })
                                    }
                                )
                            })
                        }
                    )
                )
                .then(
                    (status)=>{
                        return new Promise(
                            (resolve, reject) =>{
                                if (typeof(req.file) !== 'undefined') {
                                    console.log('file ...');    
                                    fs.unlink(req.file.path, () =>{
                                        resp.status(201);
                                        resp.format({ 	
                                            'application/json': ()=>{
                                                console.log("returning json");
                                                resp.json({added_category: req.body.category});
                                                
                                            }, 				
                                            'text/html': ()=>{
                                                console.log("returning html");
                                                resp.type('text/plain').send(`added_category: ${req.body.category}`);
                                            }
                                        })
                                        resolve;
                                    })
                                } 
                                console.log('file ...3')
                            }
                        )
                    },
                    (status)=>{ 
                        resp.status(400).type('text/plain').send(`Error ${status.error}`);
                        
                    }
                )
                .finally(()=>conn.release);
            }
        )
    }
)

// get Category
app.get('/api/category',
	(req, resp) => {
        findCategory()
            .then(result => {
                resp.status(200).type('application/json').json({result});
            })
            .catch(error => {
                resp.status(400).type('application/json').json({ error })
            })
    }
)

// add Entry
app.post('/api/entry', fileUpload.single('photo'),
    (req, resp, next) => {
        // input type=<not file>
        console.info('req.body: ', req.body);
        console.info('req.file: ', req.file);
        conns.mysql.getConnection(
            (err, conn) => {
                if (err){
                    return resp.status(500).type('text/plain').send(`Error ${err}`);
                }
                
                db.startTransaction(conn)
                .then(
                    status => {
                        const params = [
                            req.body.category
                        ]
                        console.info('find catId')
                        return (findCatId({connection:status.connection, params: params}));
                    }
                )
                .then(
                    status => {
                        console.info('file...');
                        if (typeof(req.file) == 'undefined') {
                            const params = [
                                'nothing',
                                req.body.title, 
                                status.result[0].catId,
                                req.body.username 
                            ]
                            console.info('sql params: ', params);
                            return (insertEntry({connection:status.connection, params: params}));
                        }
                        else {
                            const params = [
                                req.file.filename,
                                req.body.title, 
                                status.result[0].catId,
                                req.body.username 
                            ]
                            console.info('sql params: ', params);
                            return (insertEntry({connection:status.connection, params: params}));
                        }
                    }
                )
                .then(
                    status => {
                        console.info(`mongo inserts: ${status.result.insertId} ${req.body.description}`);
                        conns.mongodb.db('myApp').collection('entryDescription')
                            .insertOne({
                                entryId: status.result.insertId, 
                                entryDescription: req.body.description
                            })  
                            return ({connection:status.connection});   
                    }
                )
                .then(db.commit, db.rollback) // success, fail (or .catch)
                .then(status => 
                    new Promise(
                        (resolve, reject) => {
                            if (typeof(req.file) == 'undefined')
                                return resp.status(201).type('application/json').json({ message: 'no file given' })
                            if (err) {
                                return resp.status(400).type('application/json').json({ error })
                            }
                            console.log('file ...')
                            fs.readFile(req.file.path,(err, imgFile) => {
                                if (err)
                                    return reject({connection: status.connection, error: err})
                                const params = {
                                    Bucket: 'belloz', Key: `myApp/${req.file.filename}`,  // post photo on DO spaces 
                                    Body: imgFile, ContentType: req.file.mimetype,
                                    ContentLength:  req.file.size, ACL: 'public-read'
                                }
                                conns.s3.putObject(params, 
                                    (error, result) => {
                                        if (error)
                                            return reject({ connection: status.connection, error })
                                        resolve({ connection: status.connection, result })
                                    }
                                )
                            })
                        }
                    )
                )
                .then(
                    (status)=>{
                        return new Promise(
                            (resolve, reject) =>{
                                if (typeof(req.file) !== 'undefined') {
                                    console.log('file ...');    
                                    fs.unlink(req.file.path, () =>{
                                        resp.status(201);
                                        resp.format({ 	
                                            'application/json': ()=>{
                                                console.log("returning json");
                                                resp.json({added_category: req.body.category});
                                                
                                            }, 				
                                            'text/html': ()=>{
                                                console.log("returning html");
                                                resp.type('text/plain').send(`added_category: ${req.body.category}`);
                                            }
                                        })
                                        resolve;
                                    })
                                } 
                                console.log('file ...3')
                            }
                        )
                    },
                    (status)=>{ 
                        resp.status(400).type('text/plain').send(`Error ${status.error}`);
                        
                    }
                )
                .finally(()=>conn.release);
            }
        )
    }
)

// get All Entries (just sneak preview)
app.get('/api/entries/:category',
    (req, resp) => {
        const category = req.params.category
        findCatId1([category])
            .then(result => {
                return Promise.all([ Promise.resolve(result), findEntries([result[0].catId ])])
            })
            .then(results => {
                const r0 = results[0];
                const r1 = results[1];
                console.info('>r1 = ', r1);
                const filtered = r1.map(v => {
                    const filter = {
                        entryId: v.entryId,
                        photo: v.photo,
                        title: v.title,
                        catId: v.catId,
                        username: v.username,
                        created: v.created
                    };
                    return filter;
                });

                resp.status(200).json({ 
                    entries: filtered
                })
            })
            .catch(error => {
                resp.status(500).json({ message: JSON.stringify(error) });
            })
    }
)        

// get Entry
app.get('/api/entry/:entryId',
    (req, resp) => {
        const entryId = parseInt(req.params.entryId);
        const p0 = getEntry([entryId])
        const p1 = conns.mongodb.db('myApp').collection('entryDescription')
            .find({entryId: entryId})
            .toArray();
        const p2 = findCategorybyEntryId([entryId]);
        Promise.all([ p0, p1, p2 ])
            .then(results => {
                const r0 = results[0];
                const r1 = results[1];
                const r2 = results[2];
                console.info('>r1 = ', r1);
                const filtered = r0.map(v => {
                    const filter = {
                        entryId: v.entryId,
                        photo: v.photo,
                        title: v.title,
                        catId: v.catId,
                        username: v.username,
                        created: v.created
                    };
                    return filter;
                });
                const filtered1 = r1.map(v => {
                    const filter1 = {
                        entryDescription: v.entryDescription
                    };
                    return filter1;
                });
                resp.status(200).type('application/json').json({
                    entryInfo: filtered,  
                    entryDescription: filtered1,
                    category: r2
                })
            })
            .catch(error => {
                resp.status(500).json({ message: JSON.stringify(error) });
            })
    }
)        

// edit Entry
app.put('/api/entry/:entryId/edit', fileUpload.single('photo'),
    (req, resp) => {
        console.info('request body:', req.body);
        console.info('request params:', req.params);
        console.info('request file:', req.file);
        conns.mysql.getConnection(
            (err, conn) => {
                if (err){
                    return resp.status(500).json({ message: JSON.stringify(error) });
                }
                db.startTransaction(conn)
                .then(
                    status => {
                        const params = [
                            req.body.category
                        ]
                        return (findCatId({connection:status.connection, params: params}));
                    }
                )
                .then(
                    status => {
                        console.info('file...');
                        if (typeof(req.file) == 'undefined') {
                            const params = [
                                'nothing',  
                                req.body.title, 
                                status.result[0].catId, 
                                req.body.username,
                                req.params.entryId 
                            ]
                            console.info('sql params: ', params);
                            return (updateEntryByEntryId({connection:status.connection, params: params}));
                        }
                        else {
                            const params = [
                                req.file.filename,  
                                req.body.title, 
                                status.result[0].catId, 
                                req.body.username,
                                req.params.entryId 
                            ]
                            console.info('sql params: ', params);
                            return (updateEntryByEntryId({connection:status.connection, params: params}));
                        }
                    }
                )
                .then(
                    status => {
                        console.info(`mongo inserts: ${status.result.insertId} ${req.body.description}`);
                        const id = parseInt(req.params.entryId);
                        conns.mongodb.db('myApp').collection('entryDescription')
                            .updateOne(
                                { entryId: id},
                                {
                                    $set: { entryDescription: req.body.description} 
                                }
                            )
                            return ({connection:status.connection});   
                    }
                )
                .then(db.commit, db.rollback) // success, fail (or .catch)
                .then(status => 
                    new Promise(
                        (resolve, reject) => {
                            if (typeof(req.file) == 'undefined')
                                return resp.status(201).type('application/json').json({ message: 'no file given' })
                            if (err) {
                                return resp.status(400).type('application/json').json({ error })
                            }
                            console.log('file ...')
                            fs.readFile(req.file.path,(err, imgFile) => {
                                if (err)
                                    return reject({connection: status.connection, error: err})
                                const params = {
                                    Bucket: 'belloz', Key: `myApp/${req.file.filename}`,
                                    Body: imgFile, ContentType: req.file.mimetype,
                                    ContentLength:  req.file.size, ACL: 'public-read'
                                }
                                conns.s3.putObject(params, 
                                    (error, result) => {
                                        if (error)
                                            return reject({ connection: status.connection, error })
                                        resolve({ connection: status.connection, result })
                                    }
                                )
                            })
                        }
                    )
                )
                .then(
                    (status)=>{
                        return new Promise(
                            (resolve, reject) =>{
                                if (typeof(req.file) !== 'undefined') {
                                    console.log('file ...');    
                                    fs.unlink(req.file.path, () =>{
                                        resp.status(201);
                                        resp.format({ 	
                                            'application/json': ()=>{
                                                console.log("returning json");
                                                resp.json({added_category: req.body.category});
                                                
                                            }, 				
                                            'text/html': ()=>{
                                                console.log("returning html");
                                                resp.type('text/plain').send(`added_category: ${req.body.category}`);
                                            }
                                        })
                                        resolve;
                                    })
                                } 
                                console.log('file ...3')
                            }
                        )
                    },
                    (status)=>{ 
                        resp.status(400).type('text/plain').send(`Error ${status.error}`);
                        
                    }
                )
                .finally(()=>conn.release);
            }
        )
    }
)


// delete Entry
app.post('/api/entry/:entryId/delete', fileUpload.single('photo'),
    (req, resp) => {
        console.info('request body:', req.body);
        console.info('request params:', req.params);
        conns.mysql.getConnection(
            (err, conn) => {
                if (err){
                    return resp.status(500).json({ message: JSON.stringify(error) });
                }
                db.startTransaction(conn)
                .then(
                    status => {
                        const params = [
                            req.body.category
                        ]
                        return (findCatId({connection:status.connection, params: params}));
                    }
                )
                .then (
                    status => {
                        const params = [
                            req.body.photo,
                            req.body.title, 
                            status.result[0].catId,
                            req.body.username 
                        ]
                        console.info('sql insert deleted_entry params: ', params);
                        return (insertDeletedEntry({connection:status.connection, params: params}));
                    }
                )
                .then(
                    status => {
                        console.info(`mongo inserts deleted_entry: ${status.result.insertId} ${req.body.description}`);
                        conns.mongodb.db('myApp').collection('deleted_entryDescription')
                            .insertOne({
                                entryId: status.result.insertId, 
                                entryDescription: req.body.description
                            })  
                            return ({connection:status.connection});   
                    }
                )
                .then (
                    status => {
                        const params = [
                            req.params.entryId
                        ]
                        console.info('sql delete params: ', params);
                        return (deleteEntry({connection:status.connection, params: params}));
                    }
                )
                .then(
                    status => {
                        const id = parseInt(req.params.entryId);
                        conns.mongodb.db('myApp').collection('entryDescription')
                            .deleteOne({
                                entryId: id
                            })  
                            console.info(`mongo delete: ${req.params.entryId}`);
                            return ({connection:status.connection});   
                    }
                )
                .then(db.commit, db.rollback) // success, fail (or .catch)
                
                .then(status =>
                    resp.status(201).json({ message: JSON.stringify(status.result)})
                )
                .catch(status =>
                    resp.status(400).json({ message: JSON.stringify(status.error) })
                )
                .finally(()=>conn.release);
            }
        )
    }
)

// search Bar (sneak preview; later click in to view an entry)
app.get('/api/search/:term',
    (req, resp) => {
        const limit = parseInt(req.query.limit) || 5;
        const offset = parseInt(req.query.offset) || 0;
        const term = req.params.term;

        conns.mongodb.db('myApp').collection('entryDescription')
            .createIndex({
                entryDescription: 'text'
            })
        const p0 = conns.mongodb.db('myApp').collection('entryDescription')
            .find({    
                $text: {$search: `"${term}"`}
            })
            .limit(limit).skip(offset)
            .toArray();
        Promise.all([ p0 ])
            .then(results => {
                const r0 = results[0];
                const filtered = r0.map(v => {
                    const filter = {
                        entryId: v.entryId,
                        entryDescription: v.entryDescription
                    };
                    return filter;
                });
                resp.status(200).type('application/json').json({
                    description: filtered
                })
            })
            .catch(error => {
                resp.status(500).json({ message: JSON.stringify(error) });
            })
        }
    )  


app.get('/api/count',
	(req, resp) => {
        entryCount()
        .then(result => {
            return resp.status(200).type('application/json').json({result})
        })
        .catch(error => {
            return resp.status(500).json({ message: JSON.stringify(error)});
        })
    }
)
    
app.use(express.static(__dirname + '/public'));

testConnections(conns)
	.then(() => {
		app.listen(PORT,
			() => {
				console.info(`Application started on port ${PORT} at ${new Date()}`);
			}
		)
	})
	.catch(error => {
		console.error(error);
		process.exit(-1);
    })
