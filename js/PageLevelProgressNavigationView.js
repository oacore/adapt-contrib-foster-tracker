define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');
    var completionCalculations = require('./completionCalculations');

    var PageLevelProgressView = require('extensions/adapt-contrib-pageLevelProgress/js/PageLevelProgressView');

    var PageLevelProgressNavigationView = Backbone.View.extend({

        tagName: 'button',

        className: 'base page-level-progress-navigation',

        initialize: function() {
            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(Adapt, 'router:location', this.updateProgressBar);
            this.listenTo(Adapt, 'pageLevelProgress:update', this.refreshProgressBar);
            this.listenTo(this.collection, 'change:_isComplete', this.updateProgressBar);
            this.listenTo(this.model, 'change:_isComplete', this.updateProgressBar);
            this.$el.attr('role', 'button');
            this.ariaText = '';
            
            if (Adapt.course.has('_globals') && Adapt.course.get('_globals')._extensions && Adapt.course.get('_globals')._extensions._pageLevelProgress && Adapt.course.get('_globals')._extensions._pageLevelProgress.pageLevelProgressIndicatorBar) {
                this.ariaText = Adapt.course.get('_globals')._extensions._pageLevelProgress.pageLevelProgressIndicatorBar +  ' ';
            }
            
            this.render();
            
            _.defer(_.bind(function() {
                this.updateProgressBar();
            }, this));
        },

        events: {
            'click': 'onProgressClicked'
        },

        render: function() {
            var components = this.collection.toJSON();
            var data = {
                components: components,
                _globals: Adapt.course.get('_globals')
            };            

            var template = Handlebars.templates['pageLevelProgressNavigation'];
            $('.navigation-drawer-toggle-button').after(this.$el.html(template(data)));
            return this;
        },
        
        refreshProgressBar: function() {
            var currentPageComponents = _.filter(this.model.findDescendantModels('components'), function(comp) {
                return comp.get('_isAvailable') === true;
            });
            var availableChildren = completionCalculations.filterAvailableChildren(currentPageComponents);
            var enabledProgressComponents = completionCalculations.getPageLevelProgressEnabledModels(availableChildren);
            
            this.collection.reset(enabledProgressComponents);
            this.updateProgressBar();
        },

        updateProgressBar: function() {
            var completionObject = completionCalculations.calculateCompletion(this.model);
            
            //take all assessment, nonassessment and subprogress into percentage
            //this allows the user to see if assessments have been passed, if assessment components can be retaken, and all other component's completion
            
            var completed = completionObject.nonAssessmentCompleted + completionObject.assessmentCompleted + completionObject.subProgressCompleted;
            var total  = completionObject.nonAssessmentTotal + completionObject.assessmentTotal + completionObject.subProgressTotal;

            var percentageComplete = Math.floor((completed / total)*100);


            console.log( this.model.attributes.title);
            console.log(this.$('.article-container'));

            var fosterClaimButton =  document.getElementById('foster-claim-button');

            if (percentageComplete > 20 && !(typeof(fosterClaimButton) != 'undefined' && fosterClaimButton != null) ) {
                var courseHash = btoa(encodeURIComponent(this.model.attributes.title).replace(/%([0-9A-F]{2})/g,
                    function toSolidBytes(match, p1) {
                        return String.fromCharCode('0x' + p1);
                    }));

                var data = {
                    "percentComplete" : percentageComplete,
                    "courseHash" : courseHash
                };

                var template = Handlebars.templates['fosterclaimbutton'];


                if($('#foster-claim-button').length) {
                    $('#foster-claim-button').html(template(data));
                }else {
                    $('.article-container').append("<div id='foster-claim-button' class='article'>" + template(data) +"</div>");
                }


            }


            this.$('.page-level-progress-navigation-bar').css('width', percentageComplete + '%');

            // Add percentage of completed components as an aria label attribute
            this.$el.attr('aria-label', this.ariaText +  percentageComplete + '%');

            // Set percentage of completed components to model attribute to update progress on MenuView
            this.model.set('completedChildrenAsPercentage', percentageComplete);
        },

        onProgressClicked: function(event) {
            if(event && event.preventDefault) event.preventDefault();
            Adapt.drawer.triggerCustomView(new PageLevelProgressView({collection: this.collection}).$el, false);
        }

    });

    return PageLevelProgressNavigationView;

});
