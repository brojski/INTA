/* chatbot.js
   Implements processChatMessage(userMessage)
   - Detects location, interest, budget via chatbotKeywords
   - Priority: location > (interest + budget) > interest > fallback
   Returns: { success: boolean, type: "location"|"interest"|"fallback", response: string }
*/

(function(global){
  function normalizeText(s){
    return (s || "").toLowerCase();
  }

  // fuzzy detection: checks if any variant is present in text
  function detectFromVariants(text, variantsMap){
    for(const key in variantsMap){
      const variants = variantsMap[key];
      for(const v of variants){
        if(text.includes(v)) return key;
      }
    }
    return null;
  }

  function detectInterest(text){
    return detectFromVariants(text, chatbotKeywords.interests);
  }

  function detectBudget(text){
    return detectFromVariants(text, chatbotKeywords.budget);
  }

  function detectLocation(text){
    return detectFromVariants(text, chatbotKeywords.locations);
  }

  function getAttractionsForCity(city, filterType){
    const list = cityAttractions[city] || [];
    if(!filterType) return list;
    return list.filter(name => {
      const a = attractions[name];
      return a && a.type === filterType;
    });
  }

  function shortListToText(list){
    if(!list || list.length === 0) return "No matching attractions found.";
    return list.map(n => {
      const a = attractions[n];
      if(a) return `• ${n} (${a.price}, ${a.duration}) - ${a.description}`;
      return `• ${n}`;
    }).join("\n");
  }

  function processChatMessage(userMessage){
    const text = normalizeText(userMessage);

    // detect location first (highest priority)
    const loc = detectLocation(text);
    if(loc){
      // standardize city key to cityAttractions key if possible
      const cityKey = Object.keys(cityAttractions).find(c => c.toLowerCase() === loc) || loc;
      // show attractions in that city
      const interest = detectInterest(text); // optional filter
      const filtered = getAttractionsForCity(capitalizeCityKey(cityKey), interest);
      const resp = filtered.length > 0 ? `In ${capitalizeCityKey(cityKey)}, here are some ${interest ? interest + " " : ""}spots:\n${shortListToText(filtered)}` : `I found ${capitalizeCityKey(cityKey)} but no ${interest || "matching"} attractions listed. Try a nearby city or another keyword.`;
      return { success: true, type: "location", response: resp };
    }

    // detect interest + budget
    const interest = detectInterest(text);
    const budget = detectBudget(text);
    if(interest && budget){
      // find attractions across all cities matching both interest and budget constraints (simple mapping)
      const matches = [];
      for(const name in attractions){
        const a = attractions[name];
        if(a.type === interest){
          // simple budget heuristics based on price string
          const price = (a.price || "").toLowerCase();
          if(budget === "low" && (price.includes("free") || price.includes("₱") && parsePrice(price) <= 100)) matches.push(name);
          else if(budget === "medium" && (price.includes("₱") && parsePrice(price) > 100 && parsePrice(price) <= 500)) matches.push(name);
          else if(budget === "high" && (price.includes("₱") && parsePrice(price) > 500)) matches.push(name);
        }
      }
      if(matches.length){
        return { success: true, type: "interest", response: `Here are ${budget} ${interest} options:\n${shortListToText(matches)}` };
      }
    }

    // interest-only
    if(interest){
      const matches = [];
      for(const name in attractions){
        if(attractions[name].type === interest) matches.push(name);
      }
      if(matches.length){
        return { success: true, type: "interest", response: `Here are ${interest} attractions:\n${shortListToText(matches.slice(0,10))}` };
      }
    }

    // fallback
    return { success: false, type: "fallback", response: "Sorry, I couldn't detect a location or interest in your message. Try: 'cheap food in Batac' or 'beach near Pagudpud'." };

    // helpers
    function parsePrice(priceStr){
      const m = priceStr.replace(/,/g,"").match(/₱\s*([\d]+)/) || priceStr.match(/([\d]+)/);
      if(m) return Number(m[1]);
      return 0;
    }
    function capitalizeCityKey(k){
      if(!k) return k;
      // if k is one of cityAttractions keys already capitalized, return it
      const found = Object.keys(cityAttractions).find(c => c.toLowerCase() === k.toLowerCase());
      return found || k.charAt(0).toUpperCase() + k.slice(1);
    }
  }

  global.processChatMessage = processChatMessage;
})(window);
