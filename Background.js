/**
Background when starts checks if the state is autologin
if state == autologin, it starts the Autologin Interval
It also observes for the changes in state, changes Autologin on off accordingly
*/

const urlLogin = "https://agnigarh.iitg.ac.in:1442/login?"

let userName
let password

const LOGGED_OUT_STATE = "logged_out"
const AUTOLOGIN_STATE = "autologin"
const NO_CREDS_STATE = "no_creads_state"

async function ActionLogin() {
    try {
        const response = await fetch(urlLogin);
        const html = await response.text();
        console.log(html);
        let parser = new DOMParser();
        let doc = parser.parseFromString(html, 'text/html');
        let magic_input_value = doc.querySelector('input[name="magic"]').value;
        console.log(magic_input_value);

        const params = new URLSearchParams();
        params.append('magic', magic_input_value);
        params.append('4Tredir', "https://agnigarh.iitg.ac.in:1442/login?")
        params.append('username', userName)
        params.append('password', password)

        const postResponse = await fetch(urlLogin, {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const postData = await postResponse.text();
        console.log(postData);

    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

console.log('Hello, running in background')

let intervalId;
function StartAutologin() {
    if (intervalId) EndAutoLogin()
    intervalId = setInterval(() => {
        // Your code to run every 5 minutes goes here
        ActionLogin().then().catch()
        console.log('Executing every 5 minutes...');
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
}

function EndAutoLogin() {
    if (intervalId) {
        console.log('Interval deactivated');
        clearInterval(intervalId);
        intervalId = null;
    } else {
        console.log('Interval is not active');
    }
}
function FetchCreds(){
    QueryStorage('password',(res)=>{password = res})
    QueryStorage('username', (res)=>{userName= res})
}

QueryStorage('state',(state)=>{
    if (state == AUTOLOGIN_STATE) StartAutologin()
})

chrome.storage.onChanged
    .addListener((changes, namespace) => {
        let autoLoginEnabled = false
        for (let key in changes) {
            let storageChange = changes[key]
            if (key == 'state' && storageChange.newValue == AUTOLOGIN_STATE) {
                autoLoginEnabled = true
                break
            }
        }
        if (autoLoginEnabled) {
            StartAutologin()
            FetchCreds()
            console.log('creds fetched are', userName, password)
        } else {
            EndAutoLogin()
        }
    })


//Utils
function QueryStorage(key, callback){
    chrome.storage.sync.get(key, function(result) {
        if (chrome.runtime.lastError) {
            // Handle potential error
            console.error(chrome.runtime.lastError);
            callback(null); // Pass null or handle the error accordingly
        } else {
            if (!(key in result)) {
                console.warn(`Key '${key}' not found in sync storage.`);
            }

            // Pass the result to the callback
            callback(result[key]);
        }
    });
}

function SaveData(key, value) {
    const dataToSave = { [key]: value };

    chrome.storage.sync.set(dataToSave, function() {
        if (chrome.runtime.lastError) {
            // Handle potential error
            console.error(chrome.runtime.lastError);
        } else {
            console.log(`Data saved for key '${key}'`);
        }
    });
}