/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires plugins/Tool.js
 * @requires widgets/NewSourceWindow.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = ZoekCsw
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: ZoekCsw(config)
 *
 *    Plugin for removing a selected layer from the map.
 *    TODO Make this plural - selected layers
 */
gxp.plugins.ZoekCsw = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gxp_zoekcsw */
    ptype: "app_zoekcsw",

    /** api: config[addActionText]
     *  ``String``
     *  Text for add menu item (i18n).
     */
    addActionText: "Kaartenbak",
    
    /** api: config[addActionMenuText]
     *  ``String``
     *  Text for add menu item (i18n).
     */
    addActionMenuText: "Kaarten uit de kaartenbak",

    /** api: config[addActionTip]
     *  ``String``
     *  Text for add action tooltip (i18n).
     */
    addActionTip: "Voeg kaarten toe",
       
    /** api: config[doneText]
     *  ``String``
     *  Text for Done button (i18n).
     */
    doneText: "Sluiten",

    /** api: config[autoLoad]
     *  ``Boolean``
     *  If provided, the catalog dialog will be shown after loading of the app.
     */
    autoLoad: false,
    
    /** api: config[search]
     *  ``Object | Boolean``
     *  If provided, a :class:`gxp.CatalogueSearchPanel` will be added as a
     *  menu option. This panel will be constructed using the provided config.
     *  By default, no search functionality is provided.
     */
    
    /** private: property[selectedSource]
     *  :class:`gxp.plugins.LayerSource`
     *  The currently selected layer source.
     */
    selectedSource: null,
    
    /** api: method[addActions]
     */
    addActions: function() {
        var selectedLayer;
        var actions = gxp.plugins.ZoekCsw.superclass.addActions.apply(this, [{
            tooltip : this.addActionTip,
            text: this.addActionText,
            menuText: this.addActionMenuText,
            //disabled: true,
            iconCls: "icon-addlayers",
            handler : this.showCapabilitiesGrid,
            scope: this
        }]);
        
        this.target.on("ready", function() { 
          if (this.autoLoad) {
            this.showCapabilitiesGrid();
          }
        }, this);
        return actions;
    },
        
    /** api: method[showCapabilitiesGrid]
     * Shows the window with a capabilities grid.
     */
    showCapabilitiesGrid: function() {
        if(!this.catalogDialog) {
            this.initCatalogDialog();
        }
        this.catalogDialog.show();
    },
    
    /**
     * private: method[initCapGrid]
     * Constructs a window with a capabilities grid.
     */
    initCatalogDialog: function() {
		target = this.target;
		cswhost = this.initialConfig.search.selectedSource;

        function init () {
            this.use_proxy = true;
            this.defaultschema = "http://www.isotc211.org/2005/gmd";
            this.schema = "http://www.opengis.net/cat/csw/2.0.2";
            this.stylesheet = xslt = loadDocument("../div/xsl/csw-results.xsl");
            this.getrecords_xsl = loadDocument("../div/xsl/getrecords.xsl");
            this.modified_xml = loadDocument("../div/xml/modified.xml");
            this.defaults_xml = loadDocument("../div/xml/defaults.xml");         
            this.getrecordbyid_xsl = loadDocument("../div/xsl/getrecordbyid.xsl");
            this.defaults_xml = loadDocument("../div/xml/defaults.xml");
            this.init = true;
            getRecords(1);
        };
		
        function search (searchstring, message) {
        	this.query = searchstring.trim();
        	var outputDiv = document.getElementById("csw-output");
        	outputDiv.innerHTML = "";
        	if (this.query != "") {
        				outputDiv.style.display = "block";
        				document.getElementById("csw-details").style.display = "none";
        				outputDiv.innerHTML = message;
                this.init = false;
				        getRecords(1);
            }
        };
        
        var generateAddButtons = function() {
            var items = Ext.DomQuery.select('div[class=btn_add]');   
            for (var i = 0; i < items.length; i++) {
            	var add_enabled = false;
                var add_id = items[i].id.toString();
                var add_record = items[i].innerHTML.toString();
                var add_url = items[i].title.toString();
                var source = this.target.layerSources[layerKey(add_url).key];
                items[i].innerHTML = "";                
                if (source) {
					items[i].title = "Voeg gegevens toe aan de ZaanAtlas";
					new Ext.Button({
						id: add_id,
						renderTo: add_id,
						text: 'Voeg kaart toe',
						iconCls: 'icon-addlayers',
						handler: getRecordvalueById.createDelegate(this, [add_record], ["string"] ),
						scope: this
						});
                } else {
					items[i].title = "Deze kaart is alleen intern beschikbaar";
					new Ext.Button({
						id: add_id,
						renderTo: add_id,
						text: 'Niet beschikbaar',
						iconCls: 'icon-addlayers-locked',
						disabled: true,
						scope: this
						});
                }
            };
        };

        var generateInfoButtons = function() {
            var items = Ext.DomQuery.select('div[class=btn_info]');  
            for (var j = 0; j < items.length; j++) { 
                var recordId = new String();
                recordId = items[j].id.toString();
                items[j].title = "Vraag de metadata op van deze gegevens";            
                new Ext.Button({
                    id: recordId,
                    renderTo: recordId,
                    text: 'Metadata',
                    iconCls: 'gxp-icon-metadata',
                    handler: embedMeta.createDelegate(this, [recordId] ),
                    scope: this
                });
            };
        };

        var generateNavigateButton = function() {
            var item = Ext.DomQuery.select('div[class=btn_nextrecords]');
            var btn = Ext.getCmp('btn_nextrecords');
            var recordId = new String();
            if (item.length > 0) {
                recordId = item[0].id.toString();
                btn.enable();
                btn.value = recordId; 
            }
            else {
                btn.disable();
            }
            item = Ext.DomQuery.select('div[class=btn_previousrecords]');
            btn = Ext.getCmp('btn_previousrecords');
            if (item.length > 0) {
                recordId = item[0].id.toString();
                btn.enable();
                btn.value = recordId;
            }
            else {
                btn.disable();
            }
            item = Ext.DomQuery.select('div[class=tb_listtext]');
            tb = Ext.getCmp('tb_listtext');
            if (item.length > 0) {
                tb.setText(item[0].id.toString());
            }
        };
        
        function loadDocument(uri) {
            var xml = Sarissa.getDomDocument();
            var xmlhttp = new XMLHttpRequest();
            xml.async = false;
            xmlhttp.open("GET", uri, false);
            xmlhttp.send('');
            xml = xmlhttp.responseXML;
            return xml;
        };
        
        function hideDetails() {
      	  document.getElementById("csw-output").style.display = "block";
      	  document.getElementById("csw-details").style.display = "none";
      	  Ext.getCmp('txtSearch').show();
      	  Ext.getCmp('btnSearch').show();
      	  Ext.getCmp('btnList').show();
          Ext.getCmp('tb_itemstekst').show();
          Ext.getCmp('tb_listtext').show();
          Ext.getCmp('btn_previousrecords').show();
          Ext.getCmp('btn_nextrecords').show();
          Ext.getCmp('tb_metatext').hide();
          Ext.getCmp('btnTerug').hide();
        }
        
        function embedMeta(id) {
          document.getElementById("csw-output").style.display = "none";
          document.getElementById("csw-details").innerHTML = ' Metadata opvragen...';
          document.getElementById("csw-details").style.display = "block";
		  
          var OLrequest = OpenLayers.Request.GET({
               url : "http://geo.zaanstad.nl/geonetwork/srv/nl/metadata.show.embedded?uuid=" + id + "&currTab=simple",
               async: true,
               headers: {
                   "Content-Type": "application/html"
               },
               success : function(response) {
                   document.getElementById("csw-details").innerHTML = response.responseText;
               },
               failure : function(response) {
               	document.getElementById("csw-details").innerHTML= " Fout:\n"+ response.status + "<br>" +response.statusText;
               }
           });
          Ext.getCmp('txtSearch').hide();
	  	    Ext.getCmp('btnSearch').hide();
	  	    Ext.getCmp('btnList').hide();
          Ext.getCmp('tb_itemstekst').hide();
          Ext.getCmp('tb_listtext').hide();
          Ext.getCmp('btn_previousrecords').hide();
          Ext.getCmp('btn_nextrecords').hide();
          Ext.getCmp('tb_metatext').show();
          Ext.getCmp('btnTerug').show();
        }
        
        function handleCSWResponse (request, xml) { 
            var stylesheet = "../div/xsl/prettyxml.xsl";
            var displaymode = "html";
            var outputDiv = document.getElementById("csw-output");
            document.getElementById("csw-details").style.display = "none";

            var processor = new XSLTProcessor();
            processor.importStylesheet(this.stylesheet);

            var XmlDom = processor.transformToDocument(xml)
            var output = GetXmlContent(XmlDom);
     
            outputDiv.innerHTML = output; 
            generateAddButtons();
            generateInfoButtons();
            generateNavigateButton();
            outputDiv.style.display = "block";
            Ext.getCmp('btnTerug').hide();
        };

        function getRecords (start) {
            if (typeof start == "undefined") {
                start = 1;
            }
            if (this.init) {
                var processor = new XSLTProcessor();
                processor.importStylesheet(this.getrecords_xsl);
                setXpathValue(this.modified_xml, "/defaults/startposition", start + '');
                var request_xml = processor.transformToDocument(this.modified_xml);
                var request = GetXmlContent(request_xml);
                sendCSWRequest(request);
            }
            else {
                var queryable = "anytext";
         
                /*because geonetwork doen not follow the specs*/
                if(this.cswhost.indexOf('geonetwork') !=-1 & queryable == "anytext")
                    queryable = "any";
         
                var operator = "contains";
                var query = this.query;
                var tb = Ext.getCmp('tb_itemstekst');
                //var array = this.query.split(" ");
                if (operator == "contains" & query != "") {
                    query = "%" + query + "%";
                }

                if (this.query == "%") {
                    setXpathValue(this.defaults_xml, "/defaults/sortby", "Title" + '');
                    setXpathValue(this.defaults_xml, "/defaults/sortorder", 'ASC' + '');                    
                    tb.setText('Alfabetische lijst');
                }
                else {
                    tb.setText('Zoekresultaten');
                }
                
                setXpathValue(this.defaults_xml, "/defaults/outputschema", this.schema + '');
                setXpathValue(this.defaults_xml, "/defaults/propertyname", queryable + '');
                setXpathValue(this.defaults_xml, "/defaults/literal", query + '');
                setXpathValue(this.defaults_xml, "/defaults/startposition", start + '');

                var processor = new XSLTProcessor();
                processor.importStylesheet(this.getrecords_xsl);

                var request_xml = processor.transformToDocument(this.defaults_xml);
                //alert(new XMLSerializer().serializeToString(request_xml));
                var request = GetXmlContent(request_xml);

    			      sendCSWRequest(request);
                //csw_response = sendCSWRequest(request);
                //alert(new XMLSerializer().serializeToString(csw_response));

                //return handleCSWResponse("getrecords", csw_response);
                //return handleCSWResponse("getrecords", results_xml);
            }
        };
        
        function getRecordvalueById (id,record) {
            // gmd:linkage/gmd:URL en gmd:name/gco:CharacterString en gmd:protocol
            setXpathValue(this.defaults_xml, "/defaults/outputschema", this.defaultschema + '');
            setXpathValue(this.defaults_xml, "/defaults/id", id + '');
            
            var processor = new XSLTProcessor();
            processor.importStylesheet(this.getrecordbyid_xsl);

            var request_xml = processor.transformToDocument(this.defaults_xml);
            //var request = new XMLSerializer().serializeToString(request_xml);
            var request = GetXmlContent(request_xml);
            var gmd = "http://www.isotc211.org/2005/gmd";
            var gco = "http://www.isotc211.org/2005/gco";

            var csw_response;
            var requestxml = encodeURIComponent(request);
            var OLrequest = OpenLayers.Request.POST({
                 url : this.cswhost,
                 async: false,
                 data : request,
                 headers: {
                     "Content-Type": "application/xml"
                 },
                 success : function(response) {
                     //alert(response.responseText);
                     csw_response = response.responseXML;
                 },
                 failure : function(response) {
                	 //xml = response.responseXML;
                 }
             });
            
            var info = getElementsByTag(csw_response, gmd, "MD_DataIdentification");
            var citation = getElementsByTag(info[0], gmd,"CI_Citation");
            var title = textValue(getElementsByTag(getElementsByTag(citation[0], gmd, "title")[0], gco, "CharacterString")[0]);
            
            var transfer = getElementsByTag(csw_response, gmd, "MD_DigitalTransferOptions");
            var server = getElementsByTag(transfer[0], gmd,"CI_OnlineResource");

            var url = textValue(getElementsByTag(server[0], gmd, "URL")[0]);
            var protocol = textValue(getElementsByTag(getElementsByTag(server[0], gmd, "protocol")[0], gco, "CharacterString")[0]);
            var layer = textValue(getElementsByTag(getElementsByTag(server[0], gmd, "name")[0], gco, "CharacterString")[0]);
        	
        	var layertype = layerKey(url);    
			var source = this.target.layerSources[layertype.key];
			        
			if (source.lazy) {
				source.store.load({callback: (function() {
					insertLayer(layer, title, source, layertype.singletile, layertype.background);
				}).createDelegate(this)});
			} else {
				insertLayer(layer, title, source, layertype.singletile, layertype.background);
			}
        };
        
        function insertLayer(name, title, source, singletile, background) {
        	var layerStore = this.target.mapPanel.layers;
        	var map = this.target.mapPanel.map;
        	var record = source.createLayerRecord({
                name: name,
                title: title,
                tiled: !singletile,
                source: source.id
                });
            
            var aantal_pointerlagen = 0;
            
            if (record.data.group != "background") {
            // orden de layerStore zodanig dat de pointerlagen "Adres" en "Info" bovenaan komen te staan             
            for (var i = 0, len = layerStore.map.layers.length; i < len; i++){
            	if (layerStore.map.layers[i].name == "Adres") {
            		aantal_pointerlagen = aantal_pointerlagen + 1;	
            	};
            	if (layerStore.map.layers[i].name == "Info") {
            		aantal_pointerlagen = aantal_pointerlagen + 1;             		
            	};  	
            };
            } else {
            	aantal_pointerlagen = layerStore.map.layers.length;
            }
            
           layerStore.insert(layerStore.map.layers.length - aantal_pointerlagen, [record]); //hierdoor komen lagen altijd onder de "Adres" en "Info" pointerlagen
        };
        
        function layerKey(url) {
        	
        	var obj = {key : "publiek", background : false, singletile : false};
        
            if (url.toLowerCase().match("geo.zaanstad.nl/geowebcache") != null) {
            	obj.key = "tiles";
            	obj.background = true;
            };
            if (url.toLowerCase().match("map16z/geowebcache") != null) {
            	obj.key = "intratiles";
            	obj.background = true;
            };
            if (url.toLowerCase().match("geo.zaanstad.nl/geoserver") != null) {
            	obj.key = "publiek";
            	obj.background = false;
            };
            if (url.toLowerCase().match("map16z/geoserver") != null) {
            	obj.key = "intranet";
            	obj.background = false;
            };
            
            if (url.toLowerCase().match("singletile=true") != null) {
            	obj.singletile = true;
            };
            
            return obj;
        };
        
        function textValue(obj) {
           if (obj.innerText) {
             return obj.innerText;
            } else if (obj.text) {
             return obj.text;
            } else {
             return obj.textContent;
            }
        };
        
        function getElementsByTag(doc, url, tag) {
            var urlArray = url.split( "/" );
            var ns = urlArray[urlArray.length-1];
            var value = doc.getElementsByTagName(ns + ":" +  tag);
            if(!value || value == null || value.length == 0){
                value = doc.getElementsByTagNameNS(url,  tag);
            }
            return value;
        };
        
		function GetXmlContent (xmlDoc) {
            //var xmlDoc = ParseHTTPResponse (httpRequest);   // defined in ajax.js
            if (!xmlDoc)
                return;
            if (window.XMLSerializer) { // all browsers, except IE before version 9
                var serializer = new XMLSerializer();
            	// the serializeToString method raises an exception in IE9
                try {
                    var str = serializer.serializeToString (xmlDoc.documentElement);
                    //alert (str);
                    return str;
                }
                catch (e) {
                }
            }
            if ('xml' in xmlDoc) {  // Internet Explorer
                //alert (xmlDoc.xml);
                return xmlDoc.xml;
            }
        };

        function sendCSWRequest (request) {
            var OLrequest = OpenLayers.Request.POST({
                 url : this.cswhost,
                 async: true,
                 data : request,
                 headers: {
                     "Content-Type": "application/xml"
                 },
                 success : function(response) {
                     //alert(response.responseText);
                     var xml = response.responseXML;
                     if (!xml) {
                       var parser = new DOMParser();
                       xml = parser.parseFromString(response.responseText, 'text/xml'); }
                     handleCSWResponse("getrecords", xml);
                 },
                 failure : function(response) {
                	 //xml = response.responseXML;
                	 var outputDiv = document.getElementById("csw-output");
                	 outputDiv.innerHTML = "Kan geen verbinding maken met de metadata catalogus.<br>Probeer het s.v.p. op een later moment opnieuw.";
                	 outputDiv.style.display = "block";
            		 Ext.getCmp('btnTerug').hide();
                 }
             });
        };

        function setXpathValue (_a,_b,_c) {
            var _e=_a.selectSingleNode(_b);
            if(_e){
                if(_e.firstChild){
                    _e.firstChild.nodeValue=_c;
                }else{
                    dom=Sarissa.getDomDocument();
                    v=dom.createTextNode(_c);
                    _e.appendChild(v);
                }
                return true;
            }else{
                return false;
            }
        };

        var htmlcontainer = {
            xtype: "container",
            region: "center",
            style: {
                padding: '10px'
            },
            autoScroll: true,
            html: "<div id='csw-output'></div><div id='csw-details'></div>",
            scope: this
        };

        var topToolbar= new Ext.Panel({  
            items: [  
            {
                xtype: 'toolbar',
                dock: 'top',
                items: [  
                {
                    id: 'txtSearch',
                    xtype: 'textfield',
                    emptyText: 'Vul een zoekterm in',
                    selectOnFocus: true,
                    width: 350,
                    listeners:{  
                        scope: this,  
                        specialkey: function(f,e){  
                            if(e.getKey()==e.ENTER){  
                            var searchval = Ext.getDom('txtSearch').value;
                            search(searchval, "Zoeken naar <i>" + searchval + "</i> in de metadata catalogus..."); 
                            }
                        }
                    }
                }, {
                    id: 'btnSearch',
                    xtype: 'button',
                    iconCls:'gxp-icon-find',
                    text: 'Zoeken',
                    handler: function() {
                        var searchval = Ext.getDom('txtSearch').value;
                        search(searchval, "Zoeken naar <i>" + searchval + "</i> in de metadata catalogus...");
                    },
                    scope: this
                }, {
                    xtype: 'tbseparator',
                    width: 10
                }, {
                    id: 'btnList',
                    xtype: 'button',
                    iconCls:'icon-book-open',
                    text: 'Alfabetische lijst',
                    handler: function(f,e) {
                        if(e.shiftKey){
                            init();
                        }
                        else {
                            search("%", "Alfabetische lijst opvragen...");
                        }
                    },
                    scope: this
                }, {
                    xtype: 'tbfill'
                }, {
                    text:'Terug',
                    id: 'btnTerug',
                    iconCls:'gxp-icon-zoom-previous',
                    handler: function() {
                        hideDetails();
                    },
                    scope: this,
                    hidden: true
                }
                ]
            },
            {
                id: 'tb_listitems',
                xtype: 'toolbar',
                style: 'background: #00A5C7;',
                dock: 'top',
                items: [
                    {
                        id: 'tb_itemstekst',
                        xtype: 'tbtext',
                        text:'Recentelijk aangepaste kaartlagen',
                        style: 'font-weight:bold; color:white;'
                    }, {
                        id: 'tb_metatext',
                        xtype: 'tbtext',
                        text:'Metadata',
                        style: 'font-weight:bold; color:white;',
                        hidden: true
                    }, {
                        xtype: 'tbfill'
                    }, {
                        id: 'tb_listtext',
                        xtype: 'tbtext',
                        text: '',
                        style: 'color:#CCC;'
                    }
                ]
            }
            ]
        });

        var bbarItems = new Ext.Toolbar({  
            items: [  
            {
                id: "btn_previousrecords",
                xtype: 'button',
                text: '<< vorige',
                handler: function() {
                    var nextval = Ext.getCmp('btn_previousrecords').value;
                    getRecords( nextval );
                },
                disabled: true
            }, {
                id: "btn_nextrecords",
                xtype: 'button',
                text: 'volgende >>',
                handler: function() {
                    var nextval = Ext.getCmp('btn_nextrecords').value;
                    getRecords( nextval );
                },
                disabled: true
            }, {
                xtype: 'tbfill'
            }, {
                text: this.doneText,
                xtype: 'button',
                handler: function() {
                    this.catalogDialog.hide();
                },
                scope: this
            }
            ]
        }); 

        //TODO use addOutput here instead of just applying outputConfig
        this.catalogDialog = new Ext.Window(Ext.apply({
            title: this.addActionMenuText,
            closeAction: "hide",
            layout: "border",
            maximizable: true,  
            height: this.target.mapPanel.getSize().height, //600,
            maxHeight: 800,
            width: 650,
            //modal: true,
            items: htmlcontainer,
            tbar: topToolbar,
            bbar: bbarItems
        }, this.initialConfig.outputConfig));

        init();
    }
});

Ext.preg(gxp.plugins.ZoekCsw.prototype.ptype, gxp.plugins.ZoekCsw);
