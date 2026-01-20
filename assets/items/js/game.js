
const CARD_DEFS = {
  raven:{id:"raven",label:"Raven",src:"assets/characters/raven.png"},
  willow:{id:"willow",label:"Willow",src:"assets/characters/willow.png"},
  salem:{id:"salem",label:"Salem",src:"assets/characters/salem.png"},
  bo:{id:"bo",label:"Bo",src:"assets/characters/bo.png"},
  cookie:{id:"cookie",label:"Cookie",src:"assets/items/cookie.png"},
  mouse:{id:"mouse",label:"Mouse",src:"assets/items/mouse.png"},
  sock:{id:"sock",label:"Sock",src:"assets/items/sock.png"},
  feather:{id:"feather",label:"Feather",src:"assets/items/feather.png"},
  leaf:{id:"leaf",label:"Leaf",src:"assets/items/leaf.png"},
  rock:{id:"rock",label:"Rock",src:"assets/items/rock.png"},
  "security-blanket":{id:"security-blanket",label:"Security Blanket",src:"assets/items/security-blanket.png"}
};

const LEVELS=[
 {id:1,name:"Level 1 • 4 Cards (2×2)",cols:2,rows:2,pool:["raven","willow"]},
 {id:2,name:"Level 2 • 6 Cards (3×2)",cols:3,rows:2,pool:["raven","willow","cookie"]},
 {id:3,name:"Level 3 • 8 Cards (4×2)",cols:4,rows:2,pool:["raven","willow","cookie","leaf","security-blanket"]},
 {id:4,name:"Level 4 • 12 Cards (4×3)",cols:4,rows:3,pool:["raven","willow","salem","bo","cookie","mouse","security-blanket"]},
 {id:5,name:"Level 5 • 16 Cards (4×4)",cols:4,rows:4,pool:["raven","willow","salem","bo","cookie","mouse","sock","feather","security-blanket"]},
 {id:6,name:"Level 6 • 20 Cards (5×4)",cols:5,rows:4,pool:["raven","willow","salem","bo","cookie","mouse","sock","feather","leaf","rock","security-blanket"]}
];
