
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
    nurl = url.replaca(/(_sa_sdk=)([^&]*)/gi, '_sa_sdk=' + that.getCurrenId());
  }
  if(that.option.hash) {
    var queryIndex = hash.indexOf('?');
    if(queryIndex > -1) {
      nurl = host + search + '#' + hash.substring(1) + '&_sa_sdk=' + that.getCurrenId();
    } else {
      nurl = host + search + '#' + hash.substring(1) + '?_sa_sdk=' + that.getCurrenId();
    }
  } else {
    nurl = host + '?' + search.substring(1) + '&_sa_sdk=' + that.getCurrenId() + hash;
  }
  if(that._.isObject(target)) {
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
  var reffer = that._.getReferrer();
  // 先判断是否存在 first_id, 存在则表示当前域名使用的是登录 ID，则不对当前 ID 进行修改
  if(!crossDomain.isSameDomain(reffer)){
    var isAnonymousId = that.getUrlId().substring(0,1) === 'a',
        urlId = that.getUrlId().substring(1);
    if(urlId && isAnonymousId && that.store.getFirstId()) {
      that._.saEvent.send({
        original_id: urlId,
        distinct_id: store.getDistinctId(),
        type: 'track_signup',
        event: '$SignUp',
        properties: {}
      }, null);
    }
    if(urlId && isAnonymousId && !that.store.getFirstId()) {
      sd.identify(urlId, true);
    }
    if(urlId && !isAnonymousId && !that.store.getFirstId()) {
      sd.login(urlId);
    }
  }
};

crossDomain.addListen = function() {
  var that = this;
  that._.addEvent(document, 'mousedown', function(event){
    var target = event.target || event.srcElement || {};
    var nodeName = target.tagName;
    if(nodeName.toLowerCase() === "a" && target.href) {
      var protocol = target.href.protocol;
      var host = that._.getHostname(target.href);
      if(protocol === 'http' || protocol === 'https' || that.include(that.option.domain, host)) {
        if(!that.isSameDomain(host)) {
          that.rewireteUrl(target, target.href);
        }
      }
    }
  })
};

crossDomain.init = function(sd, option) {
  this._ = sd._;
  this.store = sd.store;
  this.para = sd.para;
  this.option = option;
  if(this._.isArray(option.domain) && option.domain.length > 0) {
    this.setRefferId();
    this.addListen();
  }
};


window['sensorsDataAnalytic201505'].modules = { cross_domain: crossDomain }