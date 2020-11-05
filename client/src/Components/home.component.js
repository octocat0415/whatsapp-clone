import React, { useEffect, useState } from 'react';
import Cookies from 'universal-cookie';
import getUserByToken from '../Library/getUserByToken';
import Profile from "../Icons/profile.png";
import Options from "../Icons/options.png";
import MessageIcon from "../Icons/message.jpg";
import Axios from 'axios';
import URL from '../Static/Backend.url.static';
import getAllUser from '../Library/getAllUser';
import queryString from 'query-string';
import io from 'socket.io-client';
import getUserById from '../Library/getUserById';
import crypto from "crypto-js";

let socket;
const Home = ({location}) => {
    const [userInfo, setUserInfo] = useState({});
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [width, setWidth] = useState(0);
    const [users, setUsers] = useState([]);
    const [target, setTarget] = useState('');
    const [friends, setFriends] = useState({});
    const [inputEmail, setInputEmail] = useState('');
    const [inputMessage, setInputMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const profileContent = document.querySelector("#profile-content");
    const optionsContent = document.querySelector("#options-content");
    const overlayContent = document.querySelector("#overlay-content");
    const messageContent = document.querySelector("#startMessage-content");
    const messageContentMobile = document.querySelector("#startMessage-content-mobile");
    const startMessagingContent = document.querySelector("#start-messaging-content");
    const startMessagingContentMobile = document.querySelector("#start-messaging-content-mobile");

    useEffect(() => {
        if(location.search && userInfo._id){
            const { to } = queryString.parse(location.search);
            socket = io(URL);

            setTarget(to);
            const token = new Cookies().get('token');
            socket.emit('startMessage', {sender: userInfo._id, recipient: to, token, senderEmail: userInfo.email})

            Axios.post(`${URL}/messages/get_messages`, {user: userInfo._id, token: userInfo.token, target: to})
            .then(res => {
                res.data.forEach(message => {
                    setMessages(_messages => [..._messages, message])
                })
            })
            .catch(err => console.log(err.response))

            socket.on('message', (message) => {
                if((message.recipient.email === to && message.sender.id === userInfo._id)
                    || (message.recipient.id === userInfo._id && message.sender.email === to )) setMessages(_messages => [..._messages, message])
                else{
                    getUserById(message.sender.id).then(result => {
                        setFriends(ex => ({...ex, [message.sender.id]: result}))
                    })
                }
            })
        }
        
    }, [location.search, userInfo])

    useEffect(() => {
        const token = new Cookies().get('token');
        getUserByToken(token).then(res => {
            if(res){
                if(res.status) window.location = "/login";
                else {
                    setUserInfo(res);
                    const cookie = new Cookies();
                    cookie.set('token', res.token, {path: '/', maxAge:604800 })
                }
            }else window.location = "/login";
        })
    }, [])

    useEffect(() => {
        if(userInfo.name) setName(userInfo.name)
        if(userInfo.email) setEmail(userInfo.email)
    }, [userInfo])

    useEffect(() => {
        setWidth(window.innerWidth);
        window.addEventListener('resize', () => {
            window.location.reload();
            setWidth(window.innerWidth);
        });
    }, [])

    useEffect(() => {
        const token = new Cookies().get('token')
        getAllUser(token)
        .then(result => {
            setUsers(result.filter(res => res !== userInfo.email))
        })
    }, [userInfo.email])

    const openProfileContent = () => profileContent.style.width = "25%";
    const closeProfileContent = () => profileContent.style.width = "0";

    const updateAccount = e => {
        e.preventDefault();
        Axios.post(`${URL}/users/update`, {token: userInfo.token, email: userInfo.email, new_email: email, name: name})
        .then(res => {
            setUserInfo(res.data.user);
            const cookie = new Cookies();
            cookie.set('token', res.data.user.token, {path: '/', maxAge:604800 })
            closeProfileContent()
        })
        .catch(() => setError("Someone has taken the email."))
    }

    const LogoutUser = () => {
        const cookie = new Cookies();
        cookie.remove('token', {path: '/'});
        window.location = "/login";
    }

    const openOptionsMobile = () => {
        if(optionsContent) optionsContent.style.display = "block";
    }
    const closeOptionsMobile = () => {
        if(optionsContent) optionsContent.style.display = "none";
    }

    const openOverlayMobile = () => {
        if(overlayContent) overlayContent.style.width = "100%";
        closeOptionsMobile()
    }
    const closeOverlayMobile = () => {
        if(overlayContent) overlayContent.style.width = "0";
    }
    const startMessage = () => {
        if(messageContent) messageContent.style.display = "block";
    }
    const closeStartMessage = () => {
        if(messageContent) messageContent.style.display = "none";
    }
    const startMessaging = () => {
        if(startMessagingContent) startMessagingContent.style.width = "25%";
        closeStartMessage();
    }
    const closeStartMessaging = () => {
        if(startMessagingContent) startMessagingContent.style.width = "0"
    }

    const Autocomplete = (inp, arr) =>{
        var currentFocus;
        inp.addEventListener("input", function(e) {
            var a, b, i, val = this.value;
            closeAllLists();
            if (!val) { return false;}
            currentFocus = -1;
            a = document.createElement("DIV");
            a.setAttribute("id", this.id + "autocomplete-list");
            a.setAttribute("class", "autocomplete-items");
            this.parentNode.appendChild(a);
            for (i = 0; i < arr.length; i++) {
                if (arr[i].substr(0, val.length).toUpperCase() === val.toUpperCase()) {
                    b = document.createElement("DIV");
                    b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                    b.innerHTML += arr[i].substr(val.length);
                    b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                    b.addEventListener("click", function(e) {
                        inp.value = this.getElementsByTagName("input")[0].value;
                        setInputEmail(this.getElementsByTagName("input")[0].value);
                        closeAllLists();
                    });
                    a.appendChild(b);
                }
            }
        });
        inp.addEventListener("keydown", function(e) {
            var x = document.getElementById(this.id + "autocomplete-list");
            if (x) x = x.getElementsByTagName("div");
            if (e.keyCode === 40) {
              currentFocus++;
              addActive(x);
            } else if (e.keyCode === 38) {
              currentFocus--;
              addActive(x);
            } else if (e.keyCode === 13) {
              e.preventDefault();
              if (currentFocus > -1) {
                if (x) x[currentFocus].click();
              }
            }
        });
        const addActive = (x) =>{
            if (!x) return false;
            removeActive(x);
            if (currentFocus >= x.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = (x.length - 1);
            x[currentFocus].classList.add("autocomplete-active");
        }
        const removeActive = (x) => {
            for (var i = 0; i < x.length; i++) {
                x[i].classList.remove("autocomplete-active");
            }
        }
        function closeAllLists(elmnt) {
            var x = document.getElementsByClassName("autocomplete-items");
            for (var i = 0; i < x.length; i++) {
                if (elmnt !== x[i] && elmnt !== inp) {
                    x[i].parentNode.removeChild(x[i]);
                }
            }
        }
        document.addEventListener("click", function (e) {
            closeAllLists(e.target);
        });
    }
    const StartMessageMobile = () => {
        if(messageContentMobile) messageContentMobile.style.display = "block";
    }
    const closeMessageMobile = () => {
        if(messageContentMobile) messageContentMobile.style.display = "none";
    }
    const startMessagingMobile = () => {
        if(startMessagingContentMobile) startMessagingContentMobile.style.width = "100%";
        closeMessageMobile();
    }
    const closeStartMessagingMobile = () => {
        if(startMessagingContentMobile) startMessagingContentMobile.style.width = "0";
    }

    const startChatting = e => {
        e.preventDefault();
        window.location = `/?to=${inputEmail}`
    }

    useEffect(() => {
        if(document.querySelector("#input-email") && users)
            Autocomplete(document.querySelector("#input-email"), users)
    }, [users])

    useEffect(() => {
        if(userInfo.communications){
            userInfo.communications.forEach(user => {
                getUserById(user).then(result => {
                    setFriends(friends => ({...friends, [user]: result}))
                })
            })
        }
    }, [userInfo])

    const sendMessage = e => {
        e.preventDefault();
        const token = new Cookies().get('token')
        socket.emit('sendMessage', {token, sender: userInfo._id, recipient: target, message: inputMessage, senderEmail: userInfo.email})
        setInputMessage('')
    }

    useEffect(() => console.log(messages), [messages])

    const decryptMessage = (key, message, iv) => {
        let _key = crypto.enc.Hex.parse(key);
        const result = crypto.AES.decrypt(message, _key, {
            iv: crypto.enc.Hex.parse(iv) ,
            mode: crypto.mode.CBC,
            format: crypto.format.Hex
        }).toString(crypto.enc.Utf8)
        
        return result
    }

    return(
        <div className = "container-fluid">
            {width > 900 ?
            <div>
                <div className="sidenav">
                    <div className="top-side-nav">
                        <div className="options-dropdown">
                            <img src = {Options} className="topnav-mobile-options sidenav-pp" alt="navigation bar options" onClick = {() => openOptionsMobile()} />
                            <div className="options-mobile" id="options-content">
                                <p onClick = {() => LogoutUser()}>Logout</p>
                                <p onClick = {() => closeOptionsMobile()}>Cancel</p>
                            </div>
                        </div>
                        <img src = {Profile} className="sidenav-pp" alt="Navigation bar" onClick = {() => openProfileContent()} title="Profile" />
                        <div className="options-dropdown">
                            <img src = {MessageIcon} className="sidenav-pp top-side-nav-right" alt="Navigation bar" onClick = {() => startMessage()} title="Start Message" />
                            <div className="options-mobile" id="startMessage-content">
                                <p onClick = {() => startMessaging()}>Start message</p>
                                <p>Create group</p>
                                <p onClick = {() => closeStartMessage()}>Cancel</p>
                            </div>
                        </div>
                        <div className="profile-content" id="start-messaging-content">
                            <form className="margin-left-right text-light" onSubmit = {startChatting}>
                                <span className="closebtn" onClick = {() => closeStartMessaging()}>&times;</span>
                                <h1 className="box-title">Start messaging</h1>
                                <div className="form-group autocomplete">
                                    <p className="form-label">Email:</p>
                                    <input type = "text" className="form-control" id="input-email" value={inputEmail} onChange = {({target: {value}}) => setInputEmail(value)} />
                                </div>
                                <div className="form-group">
                                    <input type = "submit" className="form-control btn btn-light" value="Chat!" />
                                </div>
                            </form>
                        </div>
                        <div className="profile-content" id="profile-content">
                            <div className="margin-left-right text-light">
                                <span className="closebtn" onClick = {() => closeProfileContent()}>&times;</span>
                                <h1 className="box-title">Your account:</h1>
                                <p className="form-error">{error}</p>
                                <form onSubmit = {updateAccount}>
                                    <div className="form-group">
                                        <p className="form-label">Name:</p>
                                        <input className="form-control bg-light text-dark" type="text" value={name} onChange = {({target: {value}}) => setName(value)} />
                                    </div>
                                    <div className="form-group">
                                        <p className="form-label">Email:</p>
                                        <input className="form-control bg-light text-dark" type = "email" value = {email} onChange = {({target: {value}}) => setEmail(value)} />
                                    </div>
                                    <div className="form-group">
                                        <input type = "submit" className="form-control btn btn-light" value="Update" />
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="margin-top-bottom">
                        {userInfo.communications && userInfo.communications.map(user => {
                            return <div className="sidenav-user" onClick = {() => window.location = `/?to=${friends[user].email}`} key = {user}>
                                <h2 className="usernav-name">{friends[user] && friends[user].name}</h2>
                                <h5 className="usernav-email">{friends[user] && friends[user].email}</h5>
                            </div>
                        })}
                    </div>
                </div>
                {target?
                <div className="main">
                    <div className="user-info">
                        <h3 className="usernav-name">{target}</h3>
                    </div>
                    <div className="messages">
                        {messages.map(message => {
                            if(String(message.sender.id) === String(userInfo._id)){
                                return <div className="messageContainer sentMessage" key = {message.iv}>
                                    <div className="messageBox messageBox-sent">
                                        <p>{decryptMessage(message.key, message.message, message.iv)}</p>
                                    </div>
                                </div>
                            }else{
                                return <div className="messageContainer receivedMessage" key = {message.iv}>
                                    <div className="messageBox messageBox-receive">
                                        <p>{decryptMessage(message.key, message.message, message.iv)}</p>
                                    </div>
                                </div>
                            }
                        })}
                    </div>
                    <form className="inputChat" onSubmit = {sendMessage}>
                        <div className="input-chat">
                            <input type = "text" className="form-control" value={inputMessage} onChange = {({target: {value}}) => setInputMessage(value)} autoFocus />
                        </div>
                        <div className="send-chat">
                            <input type ="submit" value="Send" className="send-message-button" />
                        </div>
                    </form>
                </div>:
                <div className="main">
                
                </div>}
            </div>
            /*Mobile*/
            :<div>
                <div className="topnav-mobile">
                    {!target?
                    <span className='topnav-mobile-title' onClick = {() => window.location = "/"}>Whatsapp clone</span>
                    :<span><span className='topnav-mobile-title' onClick = {() => window.location = "/"} style={{cursor: "pointer"}}>&lt;-&#9;</span>
                    <span className="usernav-email">{target}</span></span>
                    }
                    <div className="options-dropdown">
                        <img src = {Options} className="topnav-mobile-options sidenav-pp" alt="navigation bar options" onClick = {() => openOptionsMobile()} />
                        {!target?
                        <span>
                        <img src = {MessageIcon} className="sidenav-pp top-side-nav-right" alt="Navigation bar" onClick = {() => StartMessageMobile()} title="Start Message" />
                        <div className="options-mobile" id="startMessage-content-mobile">
                            <p onClick = {() => startMessagingMobile()}>Start message</p>
                            <p>Create group</p>
                            <p onClick = {() => closeMessageMobile()}>Cancel</p>
                        </div>
                        </span>
                        :null}
                        <div className="options-mobile" id="options-content">
                            <p onClick = {() => openOverlayMobile()}>Profile</p>
                            <p onClick = {() => LogoutUser()}>Logout</p>
                            <p onClick = {() => closeOptionsMobile()}>Cancel</p>
                        </div>
                    </div>
                    <div className="mobile-overlay" id="overlay-content">
                        <span className="mobile-overlay-closeBtn text-light" onClick = {() => closeOverlayMobile()}>&times;</span>
                        <div className="mobile-overlay-content">
                            <div className="form-group">
                                <h1 className="box-title text-light">Your account:</h1>
                            </div>
                            <form onSubmit = {updateAccount}>
                                <div className="form-group">
                                    <p className="form-label text-light">Name:</p>
                                    <input className="form-control bg-light text-dark" type="text" value={name} onChange = {({target: {value}}) => setName(value)} />
                                </div>
                                <div className="form-group">
                                    <p className="form-label text-light">Email:</p>
                                    <input className="form-control bg-light text-dark" type = "email" value = {email} onChange = {({target: {value}}) => setEmail(value)} />
                                </div>
                                <div className="form-group">
                                    <input type = "submit" className="form-control btn btn-light" value="Update" />
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="mobile-overlay" id="start-messaging-content-mobile">
                        <form className="margin-left-right text-light" onSubmit = {startChatting}>
                            <span className="closebtn" onClick = {() => closeStartMessagingMobile()}>&times;</span>
                            <h1 className="box-title">Start messaging</h1>
                            <div className="form-group autocomplete" style={{display: "block"}}>
                                <p className="form-label">Email:</p>
                                <input type = "text" className="form-control" id="input-email" value={inputEmail} onChange = {({target: {value}}) => setInputEmail(value)} />
                            </div>
                            <div className="form-group">
                                <input type = "submit" className="form-control btn btn-light" value="Chat!" />
                            </div>
                        </form>
                    </div>
                </div>
                {!target?
                <div className="main-mobile">
                    {userInfo.communications && userInfo.communications.map(user => {
                        return <div className="sidenav-user" onClick = {() => window.location = `/?to=${friends[user].email}`} key = {user}>
                            <h2 className="usernav-name">{friends[user] && friends[user].name}</h2>
                            <h5 className="usernav-email">{friends[user] && friends[user].email}</h5>
                        </div>
                    })}
                </div>
                :
                <div className="main-mobile-chat">
                    <div className="messages-mobile">
                        
                    </div>
                    <form className="inputChat-mobile" onSubmit = {sendMessage}>
                        <div className="input-chat-mobile">
                            <input type = "text" className="form-control" value={inputMessage} onChange = {({target: {value}}) => setInputMessage(value)} autoFocus />
                        </div>
                        <div className="send-chat-mobile">
                            <input type ="submit"  className="send-message-button" value="Send" />            
                        </div>
                    </form>
                </div>}
            </div>}
        </div>
    )
}

export default Home;