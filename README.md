# ReplDB CDN [![Run on Replit](https://repl.it/badge/github/connordennison/ReplDB-CDN)](https://repl.it/github/connordennison/ReplDB-CDN)

### How to use
Create 2 env variables with the keys of `tokens` and `domains`. `tokens` needs to be a comma separated list (not including spaces) of tokens you wish to use for your CDN. They can be anything - from email addresses to usernames to random words. `domains` needs to be a comma separated list (yet again - no spaces) of domains that point to your Repl. They don't have to be linked, they can be forwarded (as a page rule, etc), however it's probably a good idea to have one domain linked and point the others to that domain.

**Example `tokens` env var**
```
bob,jane,tim
```
(the above example is not secure at all and shouldn't be used as actual tokens, but you probably gathered that due to the mode length of these being 3)

**Example `domains` env var**
```
example.org,example.com,foo.example.com,bar.example.org
```
**Example forwarding page rule**
![ForwardingPageRule](https://art.cnnd.art/+9piAyv.png)

Make sure your Repl stays online! 
- Use a pinging service (such as [UptimeRobot](//uptimerobot.com/))

or

- Buy hacker plan to keep your Repl always on ![AlwaysOn](https://xyz.cnnd.xyz/c+D7dgU.png)