/* Preserve older root hash links on the same origin; no storage migration needed. */
if(location.pathname==='/' && location.hash){location.replace('/app/'+location.search+location.hash);}
