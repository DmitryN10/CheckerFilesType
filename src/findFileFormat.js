var fff = (function () {
    "use strict";
    //________________________________________
    var toBytes = function (s) {
        var data = [];
        for (var i = 0; i < s.length; i++) {
            data.push(s.charCodeAt(i));
        }
        return data;
    };
    const xpiZipFilename = function () {return toBytes('META-INF/mozilla.rsa')};
    const oxmlContentTypes = function () {return toBytes('[Content_Types].xml');};
    const oxmlRels = function () {toBytes('_rels/.rels');};
    //________________________________________
    function test(arr, arr2) {
        if (arr.length != arr2.length) return false;
        var on = 0;
        for (var i = 0; i < arr.length; i++) {
            for (var j = 0; j < arr2.length; j++) {
                if (arr[i] === arr2[j]) {
                    on++;
                    break;
                }
            }
        }
        return on == arr.length ? true : false;
    }
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
        };

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