domains = process.env["domains"].split(",");
hits = [0,0,0,0,0,0];

for (var i = 0; i < 2000; i++) {
  const index = Math.round(Math.random() * (domains.length - 1));
  hits[index] += 1;
}

for (domain in domains) {
  console.log(`${domains[domain]}: ${hits[domain]}`)
}