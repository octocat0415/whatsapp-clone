const { default: Axios } = require("axios")
const URL = process.env.REACT_APP_BACKEND_URL
const SECURITY_KEY = process.env.REACT_APP_SECRET_KEY;

const getUserByToken = async token => {
    if(token){
        let _userinfo = null;
        await Axios.post(`${URL}/users/get_all_users`, {key: SECURITY_KEY})
        .then(res => _userinfo = res.data)
        .catch(err => _userinfo =  err.response )
        return _userinfo
    }else return undefined;
}

module.exports = getUserByToken;