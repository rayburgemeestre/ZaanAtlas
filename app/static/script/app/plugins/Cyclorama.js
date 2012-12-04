/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = Cyclorama
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: Cyclorama(config)
 *
 *    This plugins provides an action which, when active, will issue a
 *    GetFeatureInfo request to the WMS of all layers on the map. The output
 *    will be displayed in a popup.
 */   
gxp.plugins.Cyclorama = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = app_cyclorama */
    ptype: "app_cyclorama",

    /** private: property[popupCache2]
     *  ``Object``
     */
    popupCache: null,

    /** api: config[infoActionTip]
     *  ``String``
     *  Text for feature info action tooltip (i18n).
     */
    infoActionTip: "Toon Cyclorama",

    /** api: config[popupTitle]
     *  ``String``
     *  Title for info popup (i18n).
     */
    popupTitle: "Cyclorama",
     
    /** api: method[addActions]
     */
    addActions: function() {
        this.popupCache = {};
		cyclo_plugin = this;
		
        var actions = gxp.plugins.Cyclorama.superclass.addActions.call(this, [{
            tooltip: this.infoActionTip,
            iconCls: "icon-cyclorama",
            text: this.popupTitle,
            toggleGroup: this.toggleGroup,
            enableToggle: true,
            allowDepress: true,
            toggleHandler: function(button, pressed) {
                for (var i = 0, len = cyclo.controls.length; i < len; i++){
                    if (pressed) {
                        cyclo.controls[i].activate();
                    } else {
                        cyclo.controls[i].deactivate();
                        cyclo_plugin.popup.close();
                    }
                }
             }
        }]);
        
        var cycloButton = this.actions[0].items[0];
        cycloButton.setVisible(app.intraEnabled);
        var cyclo = {controls: []};
		var updateCyclo = function() {
		var control;
		for (var i = 0, len = cyclo.controls.length; i < len; i++){
			control = cyclo.controls[i];
			control.deactivate();  // TODO: remove when http://trac.openlayers.org/ticket/2130 is closed
			control.destroy();
		}

            cyclo.controls = [];
			var Clicker = OpenLayers.Class(OpenLayers.Control, {                
				defaults: {
					pixelTolerance: 1,
					stopSingle: true
				},

				initialize: function(options) {
					this.handlerOptions = OpenLayers.Util.extend(
						{}, this.defaults
					);
					OpenLayers.Control.prototype.initialize.apply(this, arguments); 
					this.handler = new OpenLayers.Handler.Click(
						this, {click: this.trigger}, this.handlerOptions
					);
				}, 

				trigger: function(event) {
						cyclo_plugin.openPopup(this.map.getLonLatFromViewPortPx(event.xy));	
				}

			});
			
			//dragcontrol.draw();
			var clickcontrol = new Clicker()
			this.target.mapPanel.map.addControl(clickcontrol);
			cyclo.controls.push(clickcontrol);
			if(cycloButton.pressed) {
				clickcontrol.activate()
			};
		}
		
        this.target.mapPanel.layers.on("update", updateCyclo, this);
        this.target.mapPanel.layers.on("add", updateCyclo, this);
        this.target.mapPanel.layers.on("remove", updateCyclo, this);
        
        return actions;
    },
	
	openPopup: function (location) {
    
		if (!location) {
			location = this.target.mapPanel.map.getCenter();
		};
		if (this.popup && this.popup.anc) {
			this.popup.close();
		};
		
		//var position = new google.maps.LatLng(location.lat, location.lon);
		var cyclo_url = "https://globespotter.cyclomedia.com/nl/?Showmap=false&posx="+ location.lon + "&posy=" + location.lat;
	
        this.popup = new GeoExt.Popup({
        				   border:false,
						   map: this.target.mapPanel.map,
                           layout: 'fit',
                           width:1024,
						   height:700,
						   location: location,
						   maximizable: true,
						   collapsible: true,
						   anchored: true,
						   frame: true,
						   html: "<iframe src='" + cyclo_url + "' width='100%'  height='100%' seamless allowTransparency='true'/>",
						   listeners: {
								close: function() {
								// closing a popup destroys it, but our reference is truthy
								this.popup = null;
								}
								}

						   });
		this.popup.show();	
	} 
});

Ext.preg(gxp.plugins.Cyclorama.prototype.ptype, gxp.plugins.Cyclorama);