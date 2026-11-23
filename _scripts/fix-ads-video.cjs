const fs = require('fs');
let code = fs.readFileSync('src/pages/AdsBroadcast.tsx', 'utf8');

code = code.replace(
  `                {/* Ad image */}
                <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                  {selectedAd.ad_image
                    ? <img src={adAssetUrl(selectedAd.ad_image)} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Image className="w-12 h-12 text-white/10" /></div>}
                </div>`,
  `                {/* Ad media — video takes priority over image */}
                <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                  {selectedAd.ad_video
                    ? <video src={adAssetUrl(selectedAd.ad_video)} controls className="w-full h-full object-cover" poster={selectedAd.ad_image ? adAssetUrl(selectedAd.ad_image) : undefined} />
                    : selectedAd.ad_image
                      ? <img src={adAssetUrl(selectedAd.ad_image)} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Image className="w-12 h-12 text-white/10" /></div>}
                </div>
                {/* Show both image and video if both exist */}
                {selectedAd.ad_video && selectedAd.ad_image && (
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 h-24">
                    <img src={adAssetUrl(selectedAd.ad_image)} alt="Ad thumbnail" className="w-full h-full object-cover opacity-60" />
                  </div>
                )}`
);

fs.writeFileSync('src/pages/AdsBroadcast.tsx', code, 'utf8');
console.log('Done');
