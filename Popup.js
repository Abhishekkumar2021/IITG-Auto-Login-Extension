

const LOGGED_OUT_STATE = "logged_out"
const AUTOLOGIN_STATE = "autologin"
const NO_CREDS_STATE = "no_creads_state"
let state = NO_CREDS_STATE;
QueryStorage('state',(res)=>{
    state = res
})


const urlLogout = "https://agnigarh.iitg.ac.in:1442/logout?"


console.log('The state is ', state)
function applyState(){
    switch (state){
        case NO_CREDS_STATE:{
            document.getElementById('no-creds-state').style.display = "block"
            document.getElementById('creds-available-state').style.display = "none"
            document.getElementById('logged-out-state').style.display = 'none'
            document.getElementById('autologin-state').style.display = 'none'
            break
        }
        case LOGGED_OUT_STATE:{
            document.getElementById('no-creds-state').style.display = "none"
            document.getElementById('creds-available-state').style.display = "block"
            document.getElementById('logged-out-state').style.display = 'block'
            document.getElementById('autologin-state').style.display = 'none'
            break
        }
        case AUTOLOGIN_STATE:{
            document.getElementById('no-creds-state').style.display = "none"
            document.getElementById('creds-available-state').style.display = "block"
            document.getElementById('logged-out-state').style.display = 'none'
            document.getElementById('autologin-state').style.display = 'block'
            break
        }
    }
}
applyState()

const btnSetCreds = document.getElementById('set-creds-btn')
const btnChangeCreds = document.getElementById('change-creds-btn')
const btnLogout = document.getElementById('logout-btn')
const btnEnableAutologin = document.getElementById('enable-autologin-btn')
btnSetCreds.onclick = ()=>{
    chrome.runtime.openOptionsPage();
}
btnChangeCreds.onclick = ()=>{
    chrome.runtime.openOptionsPage();
}

btnLogout.onclick = async ()=>{
    let sessionCode;
    QueryStorage('session-code',(res)=>{sessionCode = res})
    await fetch(urlLogout+sessionCode)
    SaveData('state', LOGGED_OUT_STATE)
    state = LOGGED_OUT_STATE
    applyState()
}

btnEnableAutologin.onclick = async ()=>{
    SaveData('state',AUTOLOGIN_STATE)
    state = AUTOLOGIN_STATE
    applyState()
}


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