define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');
    var completionCalculations = require('extensions/adapt-contrib-pageLevelProgress/js/completionCalculations');

    var FosterCourseCompletedNavigationView = require('extensions/adapt-contrib-fostertracker/js/FosterCourseCompletedNavigationView');

    function setupPageLevelProgress(pageModel, enabledProgressComponents) {
        new FosterCourseCompletedNavigationView({model: pageModel, collection: new Backbone.Collection(enabledProgressComponents)});
    }


    // This should add/update progress on page navigation bar
    Adapt.on('router:page', function(pageModel) {


        var currentPageComponents = _.filter(pageModel.findDescendantModels('components'), function(comp) {
            return comp.get('_isAvailable') === true;
        });
        var availableComponents = completionCalculations.filterAvailableChildren(currentPageComponents);
        var enabledProgressComponents = completionCalculations.getPageLevelProgressEnabledModels(availableComponents);

        if (enabledProgressComponents.length > 0) {
            setupPageLevelProgress(pageModel, enabledProgressComponents);
        }
    });

});
