const fs = require('fs');
let code = fs.readFileSync('src/pages/AdsBroadcast.tsx', 'utf8');

code = code.replace(
  `              className="glass-card w-full max-w-xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">{selectedAdAnalytics.ad_name || 'Ad Analytics'}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Performance Breakdown</p>
                </div>
                <button onClick={() => setSelectedAdAnalytics(null)} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-muted-foreground hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6">`,
  `              className="glass-card w-full max-w-xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">{selectedAdAnalytics.ad_name || 'Ad Analytics'}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Campaign Details & Performance</p>
                </div>
                <button onClick={() => setSelectedAdAnalytics(null)} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-muted-foreground hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto flex-1">
                {/* Ad media preview */}
                <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                  {selectedAdAnalytics.ad_video
                    ? <video src={adAssetUrl(selectedAdAnalytics.ad_video)} controls className="w-full h-full object-cover" poster={selectedAdAnalytics.ad_image ? adAssetUrl(selectedAdAnalytics.ad_image) : undefined} />
                    : selectedAdAnalytics.ad_image
                      ? <img src={adAssetUrl(selectedAdAnalytics.ad_image)} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Image className="w-12 h-12 text-white/10" /></div>}
                </div>`
);

fs.writeFileSync('src/pages/AdsBroadcast.tsx', code, 'utf8');
console.log('Done');
