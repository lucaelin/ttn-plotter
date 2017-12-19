module.exports = (body)=>{
  if (Object.keys(body.payload_fields||{}).length) {
    return Object.keys(body.payload_fields).map((i)=>{
      let name = body.dev_id + " " + i;

      let x = new Date(body.metadata.time).getTime();
      let y = body.payload_fields[i];

      return {appId: body.app_id, name, x, y};
    });
  } else {
    let x = new Date(body.metadata.time).getTime();
    let payload = new Buffer(body.payload_raw, 'base64');
    let y = payload.readInt32LE();

    return [{appId: body.appId, name: body.dev_id, x, y}];
  }
};
