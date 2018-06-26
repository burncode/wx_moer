// 用 promise 封装
// 接口的命名空间
const apiSpace = {
    // 网络
    net: [
        'request',
    ],
    // 开发接口
    openAPI: [
        'login',
        'getUserInfo'
    ]
}

let rawNameArr = [];
for (let k in apiSpace) {
    rawNameArr = [...rawNameArr, ...apiSpace[k]]
}
let bindAPI = (apiName, bindObj = wx) => (o = {}) => new Promise((resolve, reject) => {

    bindObj[apiName](Object.assign({}, o, {
        success: resolve,
        fail: reject
    }))
});
const apis = rawNameArr.reduce((accu, elt) => {

    if (Object.prototype.toString.call(elt) === '[object String]') {
        accu[elt] = bindAPI(elt)
    } else {
        accu[elt.name] = bindAPI(elt.name, elt.thisArg)
    }

    return accu;
}, {});

module.exports = apis;