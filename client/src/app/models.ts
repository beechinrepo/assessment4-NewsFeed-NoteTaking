// export class NEWS {
//     constructor(
//        public urlToImage: string,
//        public author: string,
//        public title: string,
//        public description: string,
//        public content: string,
//        public publishedAt: string,
//        public topic: string,
//     ) {}
// }

export class USER {
    constructor(
       public username: string,
       public password: string,
       public email: string,
       public avatar: string
    ) {}
}

export class ENTRY {
    constructor(
        public photo: string,
        public category: string,
        public title: string,
        public description: string,
        public username: string,
        public creation?: string,
        public entryId?: string
    ) {}
}
