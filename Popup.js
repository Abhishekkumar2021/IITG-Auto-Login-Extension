const LOGGED_OUT_STATE = "logged_out"
const AUTOLOGIN_STATE = "autologin"
const NO_CREDS_STATE = "no_creads_state"
let state = localStorage['state'] != undefined ? localStorage['state'] : NO_CREDS_STATE;


const urlLogout = "https://agnigarh.iitg.ac.in:1442/logout?"


console.log('The state is ', state)

function applyState() {
	switch (state) {
		case NO_CREDS_STATE: {
			document.getElementById('no-creds-state').style.display = "block"
			document.getElementById('creds-available-state').style.display = "none"
			document.getElementById('logged-out-state').style.display = 'none'
			document.getElementById('autologin-state').style.display = 'none'
			break
		}
		case LOGGED_OUT_STATE: {
			document.getElementById('no-creds-state').style.display = "none"
			document.getElementById('creds-available-state').style.display = "block"
			document.getElementById('logged-out-state').style.display = 'block'
			document.getElementById('autologin-state').style.display = 'none'
			break
		}
		case AUTOLOGIN_STATE: {
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
btnSetCreds.onclick = () => {
	chrome.runtime.openOptionsPage();
}
btnChangeCreds.onclick = () => {
	chrome.runtime.openOptionsPage();
}

btnLogout.onclick = async () => {
	let sessionCode = localStorage['session-code']
	await fetch(urlLogout + sessionCode)
	localStorage['state'] = LOGGED_OUT_STATE
	state = LOGGED_OUT_STATE
	applyState()
	chrome.action.setIcon('Icons/icon_logged_out.png')
}

btnEnableAutologin.onclick = async () => {
	localStorage['state'] = AUTOLOGIN_STATE
	state = AUTOLOGIN_STATE
	applyState()
}

