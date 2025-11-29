/* bfs.js
   Implements BFS to find nearest cities from a start
   findNearestCities(startCity, limit = 3)
   Returns: { nearestCities: [{city, hops}], attractions: { city: [names...] } }
*/

(function(global){
  function findNearestCities(startCity, limit = 3){
    if(!startCity) return { nearestCities: [], attractions: {} };
    // normalize key to match cityGraph keys (case-insensitive)
    const keys = Object.keys(cityGraph);
    const startKey = keys.find(k => k.toLowerCase() === startCity.toLowerCase());
    if(!startKey) return { nearestCities: [], attractions: {}, error: "Start city not found in graph." };

    const visited = new Set();
    const queue = [{ city: startKey, hops: 0 }];
    const result = [];

    while(queue.length > 0 && result.length < limit){
      const node = queue.shift();
      if(visited.has(node.city)) continue;
      visited.add(node.city);
      result.push({ city: node.city, hops: node.hops });

      const neighbors = cityGraph[node.city] || [];
      for(const nb of neighbors){
        if(!visited.has(nb)) queue.push({ city: nb, hops: node.hops + 1 });
      }
    }

    const attractionsMap = {};
    for(const r of result){
      attractionsMap[r.city] = cityAttractions[r.city] || [];
    }

    return { nearestCities: result, attractions: attractionsMap };
  }

  window.findNearestCities = findNearestCities;
})(window);
