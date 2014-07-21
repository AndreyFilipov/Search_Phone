var load_page = function(wd, d, phone_model) {
	d.get('http://www.gsmarena.com');
	d.findElement(wd.By.name('sName')).sendKeys(phone_model);
	d.findElement(wd.By.id('quick-search-button')).click();
	d.sleep(3600);
	return d.findElement(wd.By.id("specs-list"));
};

function ask(question, format, callback) {
	var stdin = process.stdin, stdout = process.stdout;

	stdin.resume();
	stdout.write(question + ": ");

	stdin.once('data', function(data) {
		data = data.toString().trim();

		if (format.test(data)) {
			callback(data);
		} else {
			stdout.write("It should match: "+ format +"\n");
			ask(question, format, callback);
		}
	});
};

var webdriver = require('selenium-webdriver');
var mysql = require('mysql');
var assert = require('assert');

var connection = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'hd_user',
  password : '',
  database : 'phones'
});

connection.connect();

var elem = null;
var phone = {phone_model: '', phone_details: ''};

ask("Put a phone model", /.+/, function(phone_model) {
	var driver = new webdriver.Builder().
		withCapabilities(webdriver.Capabilities.chrome()).
		build();

	// searching for element with phone details
	elem = load_page(webdriver, driver, phone_model);

	// get the element `inner` text 
	elem.getText().then(function(elem){
		phone['phone_model'] = phone_model;
		phone['phone_details'] = elem;

		// insert the phone details into db table
		var query = connection.query('INSERT INTO phone SET ?', phone, function(err, result){
			// fetch persisted a phone model and phone details
			connection.query('SELECT * FROM phone ORDER BY id DESC LIMIT 1', function(err, rows, fields) {
				if (err) throw err;

				// open the page again
				elem = load_page(webdriver, driver, rows[0].phone_model);
		
				elem.getText().then(function(text){
					assert.equal(rows[0].phone_details, text);
					driver.quit();
					process.exit();
				});
			}); // end of SELECT

		}); // end of INSERT
	}); // end of getText

});

