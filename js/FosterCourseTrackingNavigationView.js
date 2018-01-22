define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');
    var completionCalculations = require('extensions/adapt-contrib-pageLevelProgress/js/completionCalculations');

    var FosterCourseTrackingView = Backbone.View.extend({

        tagName: 'button',

        className: 'base',

        initialize: function() {
            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(Adapt, 'router:location', this.updateTracking);
            this.listenTo(Adapt, 'pageLevelProgress:update', this.refreshTracking);
            this.listenTo(this.collection, 'change:_isComplete', this.updateTracking);
            this.listenTo(this.model, 'change:_isComplete', this.updateTracking);
            this.$el.attr('role', 'button');


            
            this.render();
            
            _.defer(_.bind(function() {
                this.updateProgressBar();
            }, this));
        },

        render: function() {
            var components = this.collection.toJSON();
            var data = {
                components: components
            };            

            var template = Handlebars.templates['fosterButton'];
            $('footer').before(this.$el.html(template(data)));
            return this;
        },

        refreshTracking: function() {
            var currentPageComponents = _.filter(this.model.findDescendantModels('components'), function(comp) {
                return comp.get('_isAvailable') === true;
            });
            var availableChildren = completionCalculations.filterAvailableChildren(currentPageComponents);
            var enabledProgressComponents = completionCalculations.getPageLevelProgressEnabledModels(availableChildren);
            
            this.collection.reset(enabledProgressComponents);
            this.updateProgressBar();
        },

        updateTracking: function() {
            var completionObject = completionCalculations.calculateCompletion(this.model);
            
            //take all assessment, nonassessment and subprogress into percentage
            //this allows the user to see if assessments have been passed, if assessment components can be retaken, and all other component's completion
            
            var completed = completionObject.nonAssessmentCompleted + completionObject.assessmentCompleted + completionObject.subProgressCompleted;
            var total  = completionObject.nonAssessmentTotal + completionObject.assessmentTotal + completionObject.subProgressTotal;

            var percentageComplete = Math.floor((completed / total)*100);
            console.log("FOSTER" + percentageComplete);
            if (precentageComplete===100){
                this.$('.page-level-progress-navigation-bar').show();
            }
        }


    });

    return PageLevelProgressNavigationView;

});
