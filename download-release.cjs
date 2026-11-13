'use strict';
const repository='PinousCEO/dobo-updates';
const latestApi=`https://api.github.com/repos/${repository}/releases/latest`;
const releasesUrl=`https://github.com/${repository}/releases`;
const variants=[
 {id:'windows-x64',label:'Windows',names:version=>[`DOBO-Setup-${version}.exe`,`DOBO-${version}-windows-x64.exe`]},
 {id:'macos-arm64',label:'macOS · Apple Silicon',names:version=>[`DOBO-${version}-arm64-mac.zip`,`DOBO-${version}-macos-arm64.zip`]},
 {id:'macos-x64',label:'macOS · Intel',names:version=>[`DOBO-${version}-mac.zip`,`DOBO-${version}-x64-mac.zip`,`DOBO-${version}-macos-x64.zip`]}
];
function validBytes(item){return Number.isSafeInteger(item.bytes)&&item.bytes>0&&/^[a-f0-9]{64}$/.test(item.sha256||'');}
function localDownloads(release,siteRoot){
 if(release?.schemaVersion!==2||!Array.isArray(release.downloads))throw Error('Invalid release manifest');
 return release.downloads.filter(item=>item.available&&variants.some(variant=>variant.id===item.id)&&/^DOBO-[A-Za-z0-9._-]+\.(exe|zip)$/.test(item.filename||'')&&validBytes(item)).map(item=>({...item,url:new URL('downloads/'+item.filename,siteRoot).href}));
}
function githubDownloads(release){
 if(!release||release.draft!==false||release.prerelease!==false||!/^v\d+\.\d+\.\d+$/.test(release.tag_name||'')||!Array.isArray(release.assets))throw Error('Invalid public release');
 const version=release.tag_name.slice(1),downloads=[];
 for(const variant of variants){
  const asset=release.assets.find(item=>variant.names(version).includes(item.name));if(!asset)continue;
  const item={id:variant.id,label:variant.label,version,filename:asset.name,bytes:asset.size,sha256:/^sha256:([a-f0-9]{64})$/.exec(asset.digest||'')?.[1]};
  if(asset.state!=='uploaded'||!validBytes(item))continue;
  const url=`https://github.com/${repository}/releases/download/${release.tag_name}/${encodeURIComponent(asset.name)}`;
  if(asset.browser_download_url!==url)continue;
  downloads.push({...item,available:true,url});
 }
 return {version,downloads};
}
module.exports={repository,latestApi,releasesUrl,localDownloads,githubDownloads};
