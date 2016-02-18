angular.module('starter.directives', ['ionic']) 

.directive('thumbnail', function ($timeout) {
  return {
    restrict: "E",
    replace: true,
    template: "<img></img>",
    link: function(scope, element, attrs) {
      attrs.$set('src', attrs.src);
      element.bind('load', function() {
        if (element[0].naturalWidth > element[0].naturalHeight) {
          element.css('height', "100%");
        } else {
          element.css('width', "100%");
        }  
      });
    } 
  }
})

.filter('trusted', ['$sce', function ($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}]);