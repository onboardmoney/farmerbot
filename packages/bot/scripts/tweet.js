// curl -X GET -H "Authorization: Bearer AAAAAAAAAAAAAAAAAAAAAN1XGwEAAAAAYKJneqIy0%2BfALbQhXlLPccThLhU%3DJzdJnd5oJY1gSVNzwvuuCZpG6xf7WTRMn9TjzYYlsK6jMnbO9y" "https://api.twitter.com/2/tweets/search/recent?query=@thefarmerbot&expansions=entities.mentions.username,author_id"

// {
//   "data":[
//     {
//       "text":"@farmerbot",
//       "id":"1294873299084771329",
//       "entities":{
//         "mentions":[
//           {"start":0,"end":9,"username":"testtest"}
//         ]
//       }
//     }
//   ],
//   "includes":{
//     "users":[
//       {"id":"1990221","name":"test","username":"testtest"}
//     ]
//   },
//   "meta":{
//     "newest_id":"1294873299084771329",
//     "oldest_id":"1294873299084771329",
//     "result_count":1
//   }
// }

// curl -X POST "http://localhost:3000/process" -d "[{"id": "1294873299084771329", "author_id": "956585733699010560", "text": "@uniswapbot swap 3 ETH DAI"}]"