function save_options() {
	const user = document.getElementById("username");
	const pass = document.getElementById("password");
	localStorage['username'] = user.value
	localStorage['password'] = pass.value
	document.getElementById('saveBtn').innerText = 'Update'
	localStorage['state'] = 'autologin'
}

// Restores select box state to saved value from localStorage.
function restore_options() {
	try {
		let user = localStorage['username']
		let pass = localStorage['password']

		if (!user || !pass) {
			return;
		}
		console.log('Creds found', user, pass)
		document.getElementById('username').value = user
		document.getElementById('password').value = pass
		document.getElementById("saveBtn").innerText = "Update"
	} catch (err) {
		//TODO
	}
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('saveBtn').addEventListener('click', save_options);




