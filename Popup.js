const LOGGED_OUT_STATE = "logged_out"
const AUTOLOGIN_STATE = "autologin"
const NO_CREDS_STATE = "no_creads_state"
let state = null


const urlLogout = "https://agnigarh.iitg.ac.in:1442/logout?"


function applyState() {
	switch (state) {
		case NO_CREDS_STATE: {
			document.getElementById('no-creds-state').style.display = "block"
			document.getElementById('creds-available-state').style.display = "none"
			document.getElementById('logged-out-state').style.display = 'none'
			document.getElementById('autologin-state').style.display = 'none'
			chrome.action.setIcon({path: 'Icons/icon_no_creds.png'})
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
//			chrome.action.setIcon({path: 'Icons/icon_active2.png'})
			break
		}
	}
}

GetData('state').then((res) => {
	state = res == undefined ? NO_CREDS_STATE : res;
	applyState()
})

const btnSetCreds = document.getElementById('set-creds-btn')
const btnChangeCreds = document.getElementById('change-creds-btn')
const btnLogout = document.getElementById('logout-btn')
const btnEnableAutologin = document.getElementById('enable-autologin-btn')
const btnRefresh = document.getElementById('btn-refresh')
const txtStatus = document.getElementById('txt-status')

btnSetCreds.onclick = () => {
	chrome.runtime.openOptionsPage();
}
btnChangeCreds.onclick = () => {
	chrome.runtime.openOptionsPage();
}
btnLogout.onclick = async () => {
//	let sessionCode = await GetData('session-code')
	await fetch(urlLogout, {
		mode: "no-cors"
	})
	chrome.action.setIcon({path: 'Icons/icon_logged_out.png'})

//	localStorage['state'] = LOGGED_OUT_STATE
	chrome.storage.local.set({'state': LOGGED_OUT_STATE})
	state = LOGGED_OUT_STATE
	applyState()
}
btnEnableAutologin.onclick = async () => {
//	localStorage['state'] = AUTOLOGIN_STATE
	chrome.storage.local.set({'state': AUTOLOGIN_STATE})
	state = AUTOLOGIN_STATE
	applyState()
}
btnRefresh.onclick = () => {
	chrome.runtime.sendMessage({
		title: 'refresh'
	})
}

GetData('status').then(async (status) => {
	const statusText = await GetData('status_text')
	logger('The status is ', status)
	txtStatus.innerText = statusText
	if (status < 10) {
		txtStatus.style.color = '#08990a'
	} else
		txtStatus.style.color = '#ff0000'

	if (status == 10) {
		btnLogout.style.display = 'none'
	} else btnLogout.style.display = 'block'

	if (status == 11) {
		if (navigator.onLine) {
			txtStatus.innerText = 'Internet Unavailable'
		} else {
			txtStatus.innerText = 'You are Disconnected'
		}
	}
})


async function GetData(key) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get([key], (res) => {
			console.log('the data is ', res[key])
			resolve(res[key])
		})
	})
}

function logger(...text) {
//	console.log(...text)
}