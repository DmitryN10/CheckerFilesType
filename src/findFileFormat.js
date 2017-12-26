var fff = (function () {
    var toBytes = function (s) {
        var data = [];
        for (var i = 0; i < s.length; i++) {
            data.push(s.charCodeAt(i));
        }
        return data;
    };
    const oxmlContentTypes = function () {return toBytes('[Content_Types].xml');};
    const oxmlRels = function () {toBytes('_rels/.rels');};

    function getType(input) {
        var buf = (input instanceof Uint8Array) ? input : new Uint8Array(input);
        if (!(buf && buf.length > 1)) {
            return null;
        }
        function check(header, options){
            options = Object.assign({
                offset: 0
            }, options);

            for (var i = 0; i < header.length; i++) {
                // If a bitmask is set
                if (options.mask) {
                    // If header doesn't equal `buf` with bits masked off
                    if (header[i] !== (options.mask[i] & buf[i + options.offset])) {
                        return false;
                    }
                } else if (header[i] !== buf[i + options.offset]) {
                    return false;
                }
            }
            return true;
        }
        function checkString(header, options) {
            return check(toBytes(header), options);
        }

        if (check([0xFF, 0xD8, 0xFF])) {
            return {
                ext: 'jpg',
                mime: 'image/jpeg'
            };
        }
        if (check([0x25, 0x50, 0x44, 0x46])) {
            return {
                ext: 'pdf',
                mime: 'application/pdf'
            };
        }
        // Zip-based file formats
        // Need to be before the `zip` check
        if (check([0x50, 0x4B, 0x3, 0x4])) {
            // https://github.com/file/file/blob/master/magic/Magdir/msooxml
            if (check(oxmlContentTypes, {offset: 30}) || check(oxmlRels, {offset: 30})) {
                var sliced = buf.subarray(4, 4 + 2000);
                var nextZipHeaderIndex = function(arr) {
                    for(var i = 0; i < arr.length - 3; i++){
                        if( arr[i] === 0x50 && arr[i + 1] === 0x4B && arr[i + 2] === 0x3 && arr[i + 3] === 0x4){
                            return i;
                        }
                    }
                };
                var header2Pos = nextZipHeaderIndex(sliced);

                if (header2Pos !== -1) {
                    var slicedAgain = buf.subarray(header2Pos + 8, header2Pos + 8 + 1000);
                    var header3Pos = nextZipHeaderIndex(slicedAgain);

                    if (header3Pos !== -1) {
                        var offset = 8 + header2Pos + header3Pos + 30;

                        if (checkString('word/', {offset: offset})) {
                            return {
                                ext: 'docx',
                                mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                            };
                        }

                        if (checkString('ppt/', {offset: offset})) {
                            return {
                                ext: 'pptx',
                                mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                            };
                        }

                        if (checkString('xl/', {offset: offset})) {
                            return {
                                ext: 'xlsx',
                                mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                            };
                        }
                    }
                }
            }
        }
        if (check([0x50, 0x4B]) && (buf[2] === 0x3 || buf[2] === 0x5 || buf[2] === 0x7) && (buf[3] === 0x4 || buf[3] === 0x6 || buf[3] === 0x8)) {
            return {
                ext: 'zip',
                mime: 'application/zip'
            };
        }
        if (check([0x52, 0x61, 0x72, 0x21, 0x1A, 0x7]) && (buf[6] === 0x0 || buf[6] === 0x1)) {
            return {
                ext: 'rar',
                mime: 'application/x-rar-compressed'
            };
        }
        if (checkString('<?xml ')) {
            return {
                ext: 'xml',
                mime: 'application/xml'
            };
        }
        return null;
    }

    var fff = {
        successHandler: null,
        errorHandler: null,
        find: function (file, successHandler, errorHandler) {
            if (!(file instanceof File)) {
                console.error("the first argument in detect function should be instance of File");
                return false;
            }

            var fr = new FileReader();
            var self = this;
            self.successHandler = successHandler;
            self.errorHandler = errorHandler;

            fr.onload = function (e) {
                var buffer = e.currentTarget.result;
                var input = new Uint8Array(buffer);
                var type = getType(input);
                if (type != null) {
                    var format = type.ext;
                } else {
                    format = null;}

                if (self.successHandler && format) {
                    self.successHandler(format);
                }

                if (self.errorHandler && !format) {
                    self.errorHandler();
                }
            }

            fr.readAsArrayBuffer(file.slice(0, 4100))
        }
    }

    return fff;

})();