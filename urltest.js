urls = ["art.cnnd.art", "cnnd.fun", "fun.cnnd.fun", "xyz.cnnd.xyz", "life.ifunny.life", "uk.co.cnnd.co.uk"];
hits = [0,0,0,0,0,0];

for (var i = 0; i < 2000; i++) {
  const index = Math.round(Math.random() * (urls.length - 1));
  hits[index] += 1;
}

for (url in urls) {
  console.log(`${urls[url]}: ${hits[url]}`)
}