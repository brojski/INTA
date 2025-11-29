/* main.js
   Integration layer - attaches to DOM elements described in the brief.
   Expected element IDs in index.html:
    - interestSelect, budgetSelect, locationSelect, timeInput, recommendBtn
    - chatInput, chatSendBtn, chatWindow (div), bfsSelect, bfsBtn
    - resultsArea (div)
*/

(function(){
  // Helper: get element by id
  const $ = id => document.getElementById(id);

  // DOM elements (may be absent if index.html uses different IDs)
  const interestSelect = $('interestSelect');
  const budgetSelect = $('budgetSelect');
  const locationSelect = $('locationSelect');
  const timeInput = $('timeInput');
  const recommendBtn = $('recommendBtn');

  const chatInput = $('chatInput');
  const chatSendBtn = $('chatSendBtn');
  const chatWindow = $('chatWindow');

  const bfsSelect = $('bfsSelect');
  const bfsBtn = $('bfsBtn');

  const resultsArea = $('resultsArea');

  // Utility to display results
  function showResults(title, lines){
    if(!resultsArea){
      console.log(title, lines);
      return;
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'result-block';
    const h = document.createElement('h3');
    h.textContent = title;
    wrapper.appendChild(h);
    const ul = document.createElement('div');
    ul.style.whiteSpace = 'pre-wrap';
    ul.textContent = lines.join("\n");
    wrapper.appendChild(ul);
    // append and scroll
    resultsArea.prepend(wrapper);
  }

  // Recommendation button handler
  if(recommendBtn){
    recommendBtn.addEventListener('click', ()=>{
      const ui = {
        interest: interestSelect ? interestSelect.value : '',
        budget: budgetSelect ? budgetSelect.value : '',
        location: locationSelect ? locationSelect.value : '',
        time: timeInput ? Number(timeInput.value) : undefined
      };
      const res = matchRules(ui);
      const matched = `Matched rules: ${res.matchedRules.length > 0 ? res.matchedRules.join(", ") : "None"}`;
      const recLines = res.recommendations.map(r => {
        if(r.details) return `• ${r.name} (${r.details.price}, ${r.details.duration}) - ${r.details.description}`;
        return `• ${r.name}`;
      });
      const total = `Total estimated time: ${Number(res.totalTimeHours).toFixed(2)} hours`;
      showResults("Recommendations", [matched, "", ...recLines, "", total]);
    });
  }

  // Chatbot handler
  if(chatSendBtn){
    chatSendBtn.addEventListener('click', ()=>{
      const msg = chatInput ? chatInput.value.trim() : '';
      if(!msg) return;
      // show user message in chat window if present
      if(chatWindow){
        const p = document.createElement('div');
        p.className = 'chat-user';
        p.textContent = `You: ${msg}`;
        chatWindow.appendChild(p);
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }
      const resp = processChatMessage(msg);
      if(chatWindow){
        const p2 = document.createElement('div');
        p2.className = 'chat-bot';
        p2.textContent = `INTA: ${resp.response}`;
        chatWindow.appendChild(p2);
        chatWindow.scrollTop = chatWindow.scrollHeight;
      } else {
        showResults("Chatbot", [resp.response]);
      }
      if(chatInput) chatInput.value = '';
    });
  }

  // BFS handler
  if(bfsBtn){
    bfsBtn.addEventListener('click', ()=>{
      const start = bfsSelect ? bfsSelect.value : null;
      const res = findNearestCities(start, 3);
      if(res.error){
        showResults("BFS Error", [res.error]);
        return;
      }
      const lines = res.nearestCities.map((n, idx) => {
        const list = (res.attractions[n.city] || []).slice(0,4).map(x => `   • ${x}`).join("\n");
        return `${idx+1}. ${n.city} (hops: ${n.hops})\n${list}`;
      });
      showResults(`Nearest cities from ${start}`, lines);
    });
  }

  // Auto-populate selects if present (simple)
  function populateSelect(selectEl, items){
    if(!selectEl) return;
    selectEl.innerHTML = '';
    items.forEach(it => {
      const o = document.createElement('option');
      o.value = it;
      o.textContent = it;
      selectEl.appendChild(o);
    });
  }

  // Populate cities list from cityAttractions keys
  const cityList = Object.keys(cityAttractions);
  populateSelect(locationSelect, cityList);
  populateSelect(bfsSelect, cityList);
  // interest and budget options if elements present
  populateSelect(interestSelect, ["history","beach","food","nature","adventure"]);
  populateSelect(budgetSelect, ["low","medium","high"]);

  // Testing helpers (console)
  console.log("INTA AI logic loaded. Available functions: matchRules(), processChatMessage(), findNearestCities()");
})();
