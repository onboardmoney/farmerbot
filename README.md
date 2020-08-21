# farmerbot

it ain't much but it's honest work

## commands

`@thefarmerbot plant` create user wallet, deposit dai, and stake

`@thefarmerbot unroot to 0x1234 / abcd.eth` withdraw stake and reward to account

`@thefarmerbot give 10 trees to @person` send trees to person

## architecture

- monitor tweets at the bot
  - script that parse tweets and sends to bot
  - mapping of tweet id to bool once processed
- map twitter ids to OM accounts
- carbon offset rankings / badges / notifications
- smart contract for interest fee splitting
