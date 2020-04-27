// _.getCookieTopLevelDomain 获取根域名
// _.getCurrentDomain 获取当前域名
// _.getReferrer 获取 referrer
// _.getHostname(url) 获取域名，必须传入 url 值

// import { addListener } from "cluster";

// _.isArray

// store.getDistinctId 获取 ID

// saEvent 需要添加到 sd 对象上
// _.include 需要添加到 _ 上
// _.rewireteUrl 需要暴露给客户，需要添加到 sd 上面

// option 参数
// var option = {
//   domaim: [],
//   hash: false,
// }
var crossDomain = {};

crossDomain.include = function(obj, target) {
  var ArrayProto = Array.prototype;
  var found = false;
  if (obj == null) {
    return found;
  }
  if (ArrayProto.indexOf && obj.indexOf === ArrayProto.indexOf) {
    return obj.indexOf(target) != -1;
  }
  each(obj, function (value) {
    if (found || (found = (value === target))) {
      return breaker;
    }
  });
  return found;
};

crossDomain.getPart = function(part) {
  var that = this,
      temp = false;
  var len = that.option.length;
  if(len) {
    for(var i = 0; i < len; i++) {
      if(part.indexOf(that.option[i]['part_url']) > -1) {
        return true;
      }
    }
  }
  return temp;
};

crossDomain.getPartHash = function(part) {
  var that = this;
  var len = that.option.length;
  var temp = false;
  if(len) {
    for(var i = 0; i < len; i++) {
      if(part.indexOf(that.option[i]['part_url']) > -1) {
        return that.option[i]['after_hash'];
      }
    }
  }
  return !!temp;
};

crossDomain.getCurrenId = function() {
  var that = this;
  var distinct_id = that.store.getDistinctId() || '',
      first_id = that.store.getFirstId() || '';
  var urlId = first_id ? 'u' + distinct_id : 'a' + distinct_id;
  return encodeURIComponent(urlId);
};


crossDomain.rewireteUrl = function(url, target) {
  var that = this;
  var reg = /([^?#]+)(\?[^#]*)?(#.*)?/;
  var arr = reg.exec(url),
      nurl = '';
  if(!arr) {
    return;
  }
  var host = arr[1] || '',
      search = arr[2] || '',
      hash = arr[3] || '';
  var idIndex = url.indexOf('_sa_sdk');
  if(idIndex > -1) {
    nurl = url.replace(/(\_sa\_sdk\=)([^&]*)/gi, '_sa_sdk=' + that.getCurrenId());
    return nurl;
  }
  if(that.getPartHash(url)) {
    var queryIndex = hash.indexOf('?');
    if(queryIndex > -1) {
      nurl = host + search + '#' + hash.substring(1) + '&_sa_sdk=' + that.getCurrenId();
    } else {
      nurl = host + search + '#' + hash.substring(1) + '?_sa_sdk=' + that.getCurrenId();
    }
  } else {
    nurl = host + '?' + search.substring(1) + '&_sa_sdk=' + that.getCurrenId() + hash;
  }
  if(target) {
    target.href = nurl;
  }
  return nurl;
};

crossDomain.isSameDomain = function(url) {
  var that = this;
  var topDomain = that._.getCookieTopLevelDomain().substring(1);
  var href = window.location.href;
  var host = that._.getHostname(href);
  if(that.para.cross_subdomain) {
    return url.indexOf(topDomain) > -1 ? true : false;
  } else {
    return url.indexOf(host) > -1 ? true : false;
  }
};

crossDomain.getUrlId = function() {
  var that = this;
  var location = document.location,
      search = location.search,
      hash = location.hash;
  var searchId = that.getUrlValue(search, '_sa_sdk') || '',
      hashId = that.getUrlValue(hash, '_sa_sdk') || '';
  return searchId ? decodeURIComponent(searchId) : decodeURIComponent(hashId);
};

crossDomain.getUrlValue = function(target, key) {
  var param = target.split('&');
  for(var i=0,len = param.length; i < len; i++) {
    var tep = param[i].split('=');
    if(tep[0] === key) {
      return tep[1];
    }
  }
};

crossDomain.setRefferId = function() {
  var that = this;
  var distinct_id = that.store.getDistinctId();
  var isAnonymousId = that.getUrlId().substring(0,1) === 'a',
      urlId = that.getUrlId().substring(1);
  if(urlId === distinct_id) {
    return;
  }
  if(urlId && isAnonymousId && that.store.getFirstId()) {
    that._.saEvent.send({
      original_id: urlId,
      distinct_id: distinct_id,
      type: 'track_signup',
      event: '$SignUp',
      properties: {}
    }, null);
  }
  if(urlId && isAnonymousId && !that.store.getFirstId()) {
    that.sd.identify(urlId, true);
  }
  if(urlId && !isAnonymousId && !that.store.getFirstId()) {
    that.sd.login(urlId);
  }
};

crossDomain.addListen = function() {
  var that = this;
  that._.addEvent(document, 'mousedown', function(event){
    var target = event.target || event.srcElement || {};
    var nodeName = target.tagName;
    if(nodeName.toLowerCase() === "a" && target.href) {
      var location = new URL(target.href);
      var protocol = location.protocol;
      if(protocol === 'http:' || protocol === 'https:') {
        if(that.getPart(target.href)) {
          that.rewireteUrl(target.href, target);
        }
      }
    }
  })
};

crossDomain.init = function(sd, option) {
  this.sd = sd;
  this._ = sd._;
  this.store = sd.store;
  this.para = sd.para;
  this.option = option;
  resolveOption(option);
  if(this._.isArray(this.option) && this.option.length > 0) {
    this.setRefferId();
    this.addListen();
  }
  function resolveOption(option) {
    var len = option.length,
        arr = [];
    for(var i = 0; i < len; i++) {
      if(option[i].hasOwnProperty('part_url') && option[i].hasOwnProperty('after_hash')) {
        arr.push(option[i]);
      } else {
        sd.log('配置的 option 格式不对，勤检查参数格式！');
      }
    }
    option = arr;
  }
};


window['sensorsDataAnalytic201505'].modules = { cross_domain: crossDomain }