# slack-pwned-scanner

This Slash command task will check if the account given by parameter was subjected to security breaches or mentioned in the most famous spammers lists.

Using [Webtask.io](https://webtask.io/) as a platform and relying on the [HaveIBeenPwned API](https://haveibeenpwned.com/API/v2), this tiny app will give you all the details about your account usage.

### Slack integration steps
* Create an application
* Enable Slash command features
* Create a new command and set the following parameters
   * Command name: Any name that best suit this command. For example: security-scan or scan-account
   * Request URL: Here you can use the one that is already deployed in Webtask: https://webtask.it.auth0.com/api/run/wt-8ac63df17c6c900a93fcefd7def6eca5-0/slack-security-scanner?webtask_no_cache=1
   * Short description: Purpose of the command
   * Hint: Help the user by entering the list of parameters or any other helpful info.


### Screen shots

#### Invoking the command
![Command parameters](https://github.com/feralberca/slack-pwned-scanner/raw/master/docs/scan-account1.png)

#### Possible answers
![Command parameters](https://github.com/feralberca/slack-pwned-scanner/raw/master/docs/scan-account2.png)

#### Enjoy it!
