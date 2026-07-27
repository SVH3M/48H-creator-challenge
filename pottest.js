// Replicate the pot-relevant functions with an injectable NOW for testing.
let NOW;
let state;
const parseLocalDate = str => { const [y,m,d]=str.split('-').map(Number); return new Date(y,m-1,d); };
function localToUTC(year,month,day,hour,min,sec,tz){
  let est=new Date(Date.UTC(year,month-1,day,hour,min,sec));
  const fmt=new Intl.DateTimeFormat('en-US',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  for(let i=0;i<3;i++){const p={};fmt.formatToParts(est).forEach(x=>{if(x.type!=='literal')p[x.type]=parseInt(x.value);});const lh=p.hour===24?0:p.hour;est=new Date(est.getTime()+Date.UTC(year,month-1,day,hour,min,sec)-Date.UTC(p.year,p.month-1,p.day,lh,p.minute,p.second));}
  return est;
}
function getPlayerDeadline(idx,tz){const b=parseLocalDate(state.startDate);b.setDate(b.getDate()+(idx+1)*state.cadenceDays);return localToUTC(b.getFullYear(),b.getMonth()+1,b.getDate(),23,59,59,tz);}
function getCurrentDeadlineIndexForPlayer(player){const tz=player.timezone||'UTC';let i=0;while(getPlayerDeadline(i,tz).getTime()<NOW.getTime())i++;return i;}
function getMissedFor(player){const done=new Set(player.completed);const cur=getCurrentDeadlineIndexForPlayer(player);const out=[];for(let i=0;i<cur;i++)if(!done.has(i))out.push(i);return out;}
function getMonthsInRace(){const s=parseLocalDate(state.startDate),n=NOW;if(n<s)return 0;return (n.getFullYear()-s.getFullYear())*12+(n.getMonth()-s.getMonth())+1;}
function getMonthlyDepositDate(m){const s=parseLocalDate(state.startDate);return new Date(s.getFullYear(),s.getMonth()+m,s.getDate());}
function getPlayerEliminationTime(player){const missed=getMissedFor(player);if(!missed.length)return Infinity;return getPlayerDeadline(missed[0],player.timezone||'UTC').getTime();}
function getActiveCountForMonth(m){const due=getMonthlyDepositDate(m).getTime();return [state.p1,state.p2,state.p3].filter(p=>getPlayerEliminationTime(p)>due).length;}
function getPotTotal(){const months=getMonthsInRace();let t=0;for(let m=0;m<months;m++)t+=getActiveCountForMonth(m)*state.monthlyDeposit;return t;}
function getCurrentActiveCount(){const months=getMonthsInRace();return months>0?getActiveCountForMonth(months-1):0;}

function fullComplete(upTo){const a=[];for(let i=0;i<=upTo;i++)a.push(i);return a;}

// Scenario A: all 3 alive, ~3 months in. Everyone completed everything so no misses.
NOW = new Date('2026-07-28T12:00:00Z');
state = { startDate:'2026-05-03', cadenceDays:2, monthlyDeposit:100,
  p1:{name:'imhem',timezone:'Asia/Bangkok',completed:fullComplete(200)},
  p2:{name:'poe',timezone:'Asia/Bangkok',completed:fullComplete(200)},
  p3:{name:'itschawin',timezone:'Asia/Bangkok',completed:fullComplete(200)} };
console.log('A) months=',getMonthsInRace(),'activeNow=',getCurrentActiveCount(),'pot=',getPotTotal(),'(expect 3 months, 3 active, 900)');

// Scenario B: p2 & p3 miss deadline #0 (eliminated in month 0). Only p1 survives.
state = { startDate:'2026-05-03', cadenceDays:2, monthlyDeposit:100,
  p1:{name:'imhem',timezone:'Asia/Bangkok',completed:fullComplete(200)},
  p2:{name:'poe',timezone:'Asia/Bangkok',completed:[]},
  p3:{name:'itschawin',timezone:'Asia/Bangkok',completed:[]} };
// p2/p3 eliminated at deadline#0 (~May 5), which is in month 0. So month0 due=May3: all alive -> +300.
// months 1,2 due Jun3/Jul3: only p1 -> +100 each => 300+100+100=500
console.log('B) months=',getMonthsInRace(),'activeNow=',getCurrentActiveCount(),'pot=',getPotTotal(),'(expect month0 300 + 2*100 = 500, active 1)');

// Scenario C: p3 eliminated partway (misses deadline in June). p1,p2 alive.
// p3 completes deadlines 0..25 then misses. deadline idx for ~Jun: (idx+1)*2 days from May3.
// Jun 3 is 31 days -> idx ~ 14.5. Let p3 complete up to idx 20 (~ Jun 12) then miss 21.
state = { startDate:'2026-05-03', cadenceDays:2, monthlyDeposit:100,
  p1:{name:'imhem',timezone:'Asia/Bangkok',completed:fullComplete(200)},
  p2:{name:'poe',timezone:'Asia/Bangkok',completed:fullComplete(200)},
  p3:{name:'itschawin',timezone:'Asia/Bangkok',completed:fullComplete(20)} };
const elim = getPlayerEliminationTime(state.p3);
console.log('C) p3 eliminated at', new Date(elim).toISOString());
for(let m=0;m<getMonthsInRace();m++){console.log('   month',m,'due',getMonthlyDepositDate(m).toDateString(),'active',getActiveCountForMonth(m));}
console.log('C) months=',getMonthsInRace(),'activeNow=',getCurrentActiveCount(),'pot=',getPotTotal());
