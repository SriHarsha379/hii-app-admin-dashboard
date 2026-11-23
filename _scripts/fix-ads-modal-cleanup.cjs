const fs = require('fs');
let code = fs.readFileSync('src/pages/AdsBroadcast.tsx', 'utf8');

// 1. Remove the duplicate image thumbnail shown below video
code = code.replace(
  `                {/* Show both image and video if both exist */}
                {selectedAd.ad_video && selectedAd.ad_image && (
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 h-24">
                    <img src={adAssetUrl(selectedAd.ad_image)} alt="Ad thumbnail" className="w-full h-full object-cover opacity-60" />
                  </div>
                )}`,
  ``
);

// 2. Update header to show campaign name
code = code.replace(
  `                <h3 className="text-base font-black text-white uppercase tracking-tight">Ad Preview</h3>`,
  `                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">{selectedAd.ad_name || 'Ad Preview'}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Campaign Details & Performance</p>
                </div>`
);

fs.writeFileSync('src/pages/AdsBroadcast.tsx', code, 'utf8');
console.log('Done');
