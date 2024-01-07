setInterval(async () => {
	(await navigator.serviceWorker.ready).active.postMessage('keepAlive');
}, 20000);


let intervalId = null;
let networkIssueDetectorId = null

function StartAutologin() {
	EndAutoLogin()
	ActionLogin().catch()

	intervalId = setInterval(() => {
		// Your code to run every 5 minutes goes here
		ActionLogin().catch()
		logger('Executing every 5 minutes...');
	}, 5 * 60 * 1000); // 5 minutes in milliseconds

	networkIssueDetectorId = setInterval(
		async function () {
			logger('Network Issue Detector Running')
			try {
				const response = await fetch('https://agnigarh.iitg.ac.in:1442/keepalive?')
				if (response.status != 200) throw 'Status-200'
			} catch (e) {
				logger('Netowrk Error ', e)
				chrome.action.setIcon({path: 'Icons/icon_logged_out.png'})
				chrome.storage.local.set({status: 11, status_text: ''})
				ActionLogin().catch()
			}

		},
		1000
	)
}

function EndAutoLogin() {
	if (intervalId) clearInterval(intervalId)
	if (networkIssueDetectorId) clearInterval(networkIssueDetectorId)
}


async function GetData(key) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get([key], (res) => {
			resolve(res[key])
		})
	})
}

function logger(...text) {
	console.log(...text)
}