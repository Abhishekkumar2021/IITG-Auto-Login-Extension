

function save_options() {
    const user = document.getElementById("username");
    const pass = document.getElementById("password");
    SaveData('username',user.value)
    SaveData('password',pass.value)
    document.getElementById('saveBtn').innerText = 'Update'
    SaveData('state','autologin')
}

// Restores select box state to saved value from localStorage.
function restore_options(){
    let user;
    let pass;
    QueryStorage('username',(res)=>{user = res})
    QueryStorage('password',(res)=>{pass = res})
    if (!user || !pass) {
        return;
    }
    console.log('Creds found')
    document.getElementById("username").value = user;
    document.getElementById("password").value = pass;
    document.getElementById("saveBtn").innerText = "Update"
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('saveBtn').addEventListener('click', save_options);


//utils
function QueryStorage(key, callback){
    chrome.storage.local.get(key, function(result) {
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
    const dataToSave = { key: value };

    chrome.storage.local.set(dataToSave,function (){
        console.log('value is set')
    })
}