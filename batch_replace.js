const fs = require('fs');
for (const page of ['dramabox', 'melolo', 'dramawave', 'netshort', 'stardusttv']) {
    const path = pp/[lang]//watch/page.tsx;
    let altPath = pp/[lang]//detail/page.tsx;
    let content = '';
    let usedPath = path;

    try {
        content = fs.readFileSync(path, 'utf8');
    } catch (e) {
        try {
            content = fs.readFileSync(altPath, 'utf8');
            usedPath = altPath;
        } catch (e) {
            console.log(Could not find );
            continue;
        }
    }

    const startIdx = content.indexOf('<div className="lg:sticky');
    if (startIdx === -1) {
        console.log(Could not find lg:sticky in );
        continue;
    }
    
    // Find matching closing div
    let matchCount = 0;
    let endIdx = -1;
    for (let i = startIdx; i < content.length - 5; i++) {
        if (content.substring(i, i+4) === '<div') {
            matchCount++;
        } else if (content.substring(i, i+5) === '</div') {
            matchCount--;
            if (matchCount === 0) {
                endIdx = i + 6;
                break;
            }
        }
    }
    
    if (endIdx === -1) {
        console.log(Could not find closing div for );
        continue;
    }

    const newBlock = \<div className="lg:sticky lg:top-24 flex h-[600px] flex-col rounded-xl bg-[#a0d1d6] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                                  <div className="flex-none border-b-[3px] border-black p-4 bg-[#a0d1d6] z-10 flex justify-between items-center">
                                      <div>
                                          <h3 className="text-lg font-black text-black uppercase tracking-tight">Daftar Episode</h3>
                                          <p className="text-sm font-bold text-black/70">Total {episodes.length} Episode</p>
                                      </div>
                                      <div className="px-3 py-1 bg-[#ffb6c1] border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                                          <span className="text-xs font-black text-black">FREE !</span>
                                      </div>
                                  </div>

                                  <div
                                      className="flex-1 overflow-y-auto p-4 overscroll-contain"
                                      onWheel={(e) => e.stopPropagation()}
                                  >
                                      <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-3 gap-3">
                                          {episodes.map((ep) => {
                                              const isActive = ep.chapterIndex === currentEpIndex;
                                              return (
                                                  <button
                                                      key={ep.chapterId}
                                                      id={\\\ep-\\\\\\}
                                                      onClick={() => selectEpisode(ep.chapterIndex)}
                                                      className={\\\lex items-center justify-center rounded-lg py-3 text-base font-black transition-all hover:-translate-y-1 active:scale-95 border-2 border-black \\\\\\}
                                                  >
                                                      <span className="text-[#6b21a8]">{\\\\\\\\\}</span>
                                                  </button>
                                              );
                                          })}
                                      </div>
                                  </div>
                              </div>\;

    const updated = content.substring(0, startIdx) + newBlock + content.substring(endIdx);
    fs.writeFileSync(usedPath, updated);
    console.log(Updated );
}
