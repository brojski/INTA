/* ruleEngine.js
   Implements matchRules(userInput)
   userInput = { interest, budget, location, time } 
   Returns: { matchedRules: [ruleIDs], recommendations: [ { name, details } ], totalTimeHours }
*/

(function(global){
  function parseDurationToHours(durStr){
    // accepts formats like "1 hour", "30 min", "1.5 hours"
    if(!durStr) return 0.5;
    durStr = durStr.toLowerCase();
    if(durStr.includes("min")) {
      const n = parseFloat(durStr) || 30;
      return n/60;
    }
    const m = durStr.match(/([\d.]+)/);
    if(m) return parseFloat(m[1]);
    return 1;
  }

  function ruleMatches(rule, input){
    const c = rule.conditions || {};
    // interest
    if(c.interest && input.interest && c.interest !== input.interest) return false;
    // budget
    if(c.budget && input.budget && c.budget !== input.budget) return false;
    // location (match lowercase)
    if(c.location && input.location && c.location.toLowerCase() !== input.location.toLowerCase()) return false;
    // timeMax means rule applies only if user's time <= timeMax hours
    if(c.timeMax !== undefined && input.time !== undefined){
      if(Number(input.time) > Number(c.timeMax)) return false;
    }
    return true;
  }

  function uniqueArray(arr){
    return Array.from(new Set(arr));
  }

  function matchRules(userInput){
    // defensive defaults
    userInput = userInput || {};
    // normalize strings
    const ui = {
      interest: (userInput.interest || "").toLowerCase(),
      budget: (userInput.budget || "").toLowerCase(),
      location: (userInput.location || "").toLowerCase(),
      time: userInput.time !== undefined ? Number(userInput.time) : undefined
    };

    const matchedRules = [];
    const recNames = [];

    for(const r of rules){
      if(ruleMatches(r, ui)){
        matchedRules.push(r.id);
        for(const name of r.recommendations){
          recNames.push(name);
        }
      }
    }

    // If no rules matched, try fallback: match by interest or location alone
    if(matchedRules.length === 0){
      for(const r of rules){
        // try looser match: interest only
        if(r.conditions && r.conditions.interest && ui.interest && r.conditions.interest === ui.interest){
          matchedRules.push(r.id);
          recNames.push(...r.recommendations);
        } else if(r.conditions && r.conditions.location && ui.location && r.conditions.location.toLowerCase() === ui.location){
          matchedRules.push(r.id);
          recNames.push(...r.recommendations);
        }
      }
    }

    // dedupe recNames and attach attractions details where available
    const uniqueRecs = uniqueArray(recNames);
    const recommendations = uniqueRecs.map(name => {
      const details = attractions[name] || null;
      return {
        name,
        details
      };
    });

    // compute total time hours (sum of durations where known)
    let totalTimeHours = 0;
    for(const r of recommendations){
      if(r.details && r.details.duration){
        totalTimeHours += parseDurationToHours(r.details.duration);
      } else {
        totalTimeHours += 0.75; // default
      }
    }

    return {
      matchedRules,
      recommendations,
      totalTimeHours
    };
  }

  // expose globally
  global.matchRules = matchRules;
})(window);
