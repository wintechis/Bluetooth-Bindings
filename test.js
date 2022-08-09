const { buffer } = require("stream/consumers");

var signed = true;
var bytelength = 2;
var byteOrder = 'big';
var offset = 0;



//const buf = Buffer.from([0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6]);

function bytes2Val() {
  let bytes = buf;
  let values = [];

  let i = 0;

  // Split in subarrays the size of bytelength
  // and interpret the data one at a time
  while (i < bytes.length) {
    sub_buf = bytes.subarray(i, i + bytelength);

    if (byteOrder == 'little') {
      if (signed) {
        parsed = sub_buf.readIntLE(offset, bytelength);
      } else {
        parsed = sub_buf.readUIntLE(offset, bytelength);
      }
    } else if (byteOrder == 'big') {
      if (signed) {
        parsed = sub_buf.readIntBE(offset, bytelength);
      } else {
        parsed = sub_buf.readUIntBE(offset, bytelength);
      }
    }

    values.push(parsed);

    i = i + bytelength;
  }

  return values;
}



function val2bytes() {
    var value = 98

    let buf = Buffer.alloc(bytelength)

    if (byteOrder == 'little') {
        if (signed) {
          parsed = buf.writeIntLE(value, offset, bytelength);
        } else {
          parsed = buf.writeUIntLE(value, offset, bytelength);
        }
      } else if (byteOrder == 'big') {
        if (signed) {
          parsed = buf.writeIntBE(value, offset, bytelength);
        } else {
          parsed = buf.writeUIntBE(value, offset, bytelength);
        }
      }

      return buf

}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
sleep(0).then(() => console.log(val2bytes()));
