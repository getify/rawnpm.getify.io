# rawnpm.getify.io

A simple node service for public URLs of raw files in ***my*** npm packages, such as:

*https://rawnpm.getify.io/asynquence/0.3.2-a/asq.js*

That file only exists in the [npm package](https://npmjs.org/package/asynquence), not in the [github](https://github.com/getify/asynquence) repo, [because it's a built](https://npmjs.org/doc/misc/npm-scripts.html#NOTE-INSTALL-SCRIPTS-ARE-AN-ANTIPATTERN) (aka, minified) file. Since it's occasionally useful to have public URL links to such files, I built **rawnpm.getify.io** for myself.

It works by using the `npm` module (available from within the npm repo -- [Inception](http://en.wikipedia.org/wiki/Inception) anyone?) to control `npm` from code.

**Note:** This service currently only serves up files **from my own repos**, because I'm not prepared to offer this diskspace/bandwidth for free to everyone, especially **NOT for those who would do evil hot-linking for production traffic usage**. Just *don't do that*. I will monitor the usage on my server and block you if you do that, so expect your sites to fail. :)

However, feel free to take this code and deploy it yourself for your own needs!

## Using the server

The way I deploy this server is as an internal server (notice the settings in **sample.secret.js**) on localhost, with a public port 80/port 443 proxy that delegates to it. I recommend that. If you don't want to do that, ignore/remove the `INTERNAL_*` settings, and take out the "x-forwarded-proto" check as it won't apply.

Regardless, you'll want to customize several things in the code.

First, set the appropriate settings in a **secret.js** that you create from the provided **sample.secret.js** file. Then, check **server.js**, and change settings like `RAWNPM_SITE` to your URL, do a global find-n-replace on "rawnpm.getify.io" and replace it with your host name, and change the ownership check in `checkPackageOwnerAndVersion(..)` from checking for a `repository.url` that matches my "getify" repos to matching yours. Also, if you're not going to use HTTPS (shame on you!), take out the check for "x-forwarded-proto".

Now, make sure you have the dependencies installed (via **package.json**) by running `npm install` from the repo directory.

To start the server, run `server.js` in your favorite way. Example: `node server.js` or `forever server.js` (better!). Also provided is my simple `server.sh` bash script which automates killing and restarting via **forever**, if you have that installed as a global utility.

## License

The code and all the documentation are released under the MIT license.

http://getify.mit-license.org/
