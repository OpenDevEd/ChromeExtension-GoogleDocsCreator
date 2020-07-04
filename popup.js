// Copyright (c) 2020 Björn Haßler. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Bugs: https://drive.google.com/drive/u/0/my-drive

var url = "";
var prefix = "";
var authuser = "";
var templateID = "";
var bms = {
    "+doc": "",
    "+sheet": "",
    "+pres": "",
    "+draw": "",
    "+form": "",
    "+docT": ""
};

var longre = /^https\:\/\/drive\.google\.com\/drive\/(u\/\d+\/)?(folders|my\-drive)/i;
var strTemplateAvailable = "A '+doc' with template is available. Enter the template link under 'options' above.";


function callback(tabs) {
    var currentTab = tabs[0]; // there will be only one in this array
    url = currentTab.url;
    //$('#url').empty().append("URL="+url);
    $('#url').empty();
    // console.log(currentTab); // also has properties like currentTab.id
    $('#panel').empty().append(getMainText(url,prefix,authuser,templateID));
    $('#details').empty().append(getDetailsText(url,prefix,authuser,templateID));
    makeCollapsible();
}


$(function() {
    chrome.tabs.query({
	active: true,
	currentWindow: true
    }    , callback);
    $('#prefix').change(function() {
	prefix = $('#prefix').val();
	$('#panel').empty().append(getMainText(url,prefix,authuser,templateID));
	$('#details').empty().append(getDetailsText(url,prefix,authuser,templateID));
    });
    $('#user').change(function() {
	authuser = $('#user').val();
	$('#panel').empty().append(getMainText(url,prefix,authuser,templateID));
	$('#details').empty().append(getDetailsText(url,prefix,authuser,templateID));
    });
    $('#template').change(function() {
	templateID = $('#template').val();
	// remove http etc
	templateID = templateID.replace(/^http.*\/d\//,"");
	templateID = templateID.replace(/\/.*$/,"");
	$('#panel').empty().append(getMainText(url,prefix,authuser,templateID));
	$('#details').empty().append(getDetailsText(url,prefix,authuser,templateID));
    });
    $('#button').click(function() {
	makeBookmarks();
	$('#buttonfeedback').empty().append("<div id=\"added\">Bookmarks added, please see 'other bookmarks'. "+prefix+"</div>");
    });
    $('#breakout').click(function() {
	newPage(getMainText(url,prefix,authuser,templateID)+getDetailsText(url,prefix,authuser,templateID));
	// genericDLlinks();
    });
});

function makeBookmarks() {
    // alert(document.title);
    chrome.bookmarks.create(
	{title: "+" +prefix},
	function(newFolder) {
	    console.log("added folder: " + newFolder.title);
	    for(key in bms){
		chrome.bookmarks.create({'parentId': newFolder.id, title: key, url: bms[key]});
	    }
	}
    );
};

function makeCollapsible() {
    var coll = document.getElementsByClassName("collapsible");
    var i;
    for (i = 0; i < coll.length; i++) {
	coll[i].addEventListener("click", function() {
	    this.classList.toggle("active");
	    var content = this.nextElementSibling;
	    if (content.style.display === "block") {
		content.style.display = "none";
	    } else {
		content.style.display = "block";
	    }
	});
    }
};

//Note: The text below (FROM_HERE TO_HERE) also works as bookmarklet!
//--FROM_HERE
function linkster(text,data,target) {
    if (!target) {
	return '<a target=\"_new\" href=\"'+data+'\">'+text+'</a><br>\n';
    } else {
	return '<a target=\"'+target+'\" href=\"'+data+'\">'+text+'</a>';
    };
};

function jster(url,postfix) {
    var out = 'javascript:(function(){';
    out += 'var href = window.location.href;';
    out += 'var d = new Date();';
    out += 'var curr_day = d.getDate();';
    out += 'curr_day++;';
    out += 'if (curr_day.toString().length==1) { curr_day = \'0\'+curr_day.toString() ; };';
    out += 'var curr_month = d.getMonth(); curr_month++;';
    out += 'if (curr_month.toString().length==1) { curr_month = \'0\'+curr_month.toString() ; };';
    out += 'var curr_year = d.getFullYear();';
    out += 'var dstr = curr_year+ \'-\' + curr_month + \'-\' + curr_day ;';
    out += 'var url=\''+url+'\'+dstr+\' '+postfix+'\';';
    out += 'var o=window.open(\'\',\'_blank\'); ';
    out += 'o.location.href = url;';
    out += '})();';
    out += '';
    return out;
};

function getDstr() {
    var d = new Date();
    var curr_date = d.getDate();
    var curr_day = d.getDay(); curr_day++;
    if (curr_day.toString().length==1) { curr_day = '0'+curr_day.toString() ; };
    var curr_month = d.getMonth(); curr_month++;
    if (curr_month.toString().length==1) { curr_month = '0'+curr_month.toString() ; };
    var curr_year = d.getFullYear();
    return curr_year+ '-' + curr_month + '-' + curr_day ;
};

function getDetailsText(href, titlePrefix, authuserName, TID) {
    var detailsPanel = '';
    if (titlePrefix != '') {
	detailsPanel+='<p>prefix: '+titlePrefix+'</p>\n';
    };
    if (authuserName != '') {
	detailsPanel+='<p>authuser: '+authuserName+'</p>\n';
    };
    if (TID != '') {
	detailsPanel  +='<p>template: '+TID+'</p>\n';
    };
    var dstr = getDstr();
    var pagetype = '';
    var baseURL = 'https://docs.google.com/';
    // We are working on a drive folder:
    if (href.match(longre)) {
	var re = 'folders/([^\/]+)';
	var found = href.match(re);
	if (found) {
	    var FOLDER_ID = found[1];
	    detailsPanel += '<p>Google drive folder: '+FOLDER_ID +'</p>\n';
	    detailsPanel += '<p>Source: '+linkster(href,'Google drive folder') + '</p>\n';
	    detailsPanel += '<p>Please note: Adding titles to Google sheets via links does not work (last tested May 2020). It is included here in case it starts working in the future.</p>\n';
	} else {
	    detailsPanel += '<p>Google drive: home page</p>\n';
	};
    } else if (href.match(/^https\:\/\/docs\.google\.com/)) {
	detailsPanel += '<p>Source: '+linkster(href,'Google doc/sheet/slide') + '</p>\n';
    } else {	    
    };
    return detailsPanel;
};

function getMainText(href, titlePrefix, authuserName, TID) {
    var smode = '';
    var modelink = {
	'pdf': '',
	'doc|pptx|xlsx': '',
	'odt|odp|ods': ''
    };
    if (titlePrefix != '') {
	// detailsPanel+='<p>prefix: '+titlePrefix+'</p>\n';
    };
    var auStr = "";
    if (authuserName != '') {
	// detailsPanel+='<p>authuser: '+authuserName+'</p>\n';
	auStr = "authuser="+authuserName + "&";
    };
    if (TID != '') {
	// detailsPanel  +='<p>template: '+TID+'</p>\n';
    };
    var dstr = getDstr();
    // https://drive.google.com/drive/u/1/folders/
    var pagetype = '';
    var baseURL = 'https://docs.google.com/';
    var create = '/create?'+auStr+'hl=en';
    // mainPanel
    var str = "";
    // We are working on a drive folder:
    if (href.match(longre)) {
	var inFolder = '';
	var copyDestination = '';
	var re = 'folders/([^\/]+)';
	var found = href.match(re);
	if (found) {
	    var FOLDER_ID = found[1];
	    inFolder = "&folder=" + FOLDER_ID;
	    copyDestination = '&copyDestination=' +FOLDER_ID;
	};
	create = create + inFolder;
	var doctemplate = '';
	str += '<h4>Create Docs in Folder</h4>\n';
	str += '<h3>Draggable links (javascript/bookmarklet)</h3>\n';
	str += "Note that you cannot click the links below within this panel! Drag them to bookmarks first, then you can click!";
	str += '<h4>Title format: Notes (+today=)'+dstr+' '+titlePrefix+'</h4>\n';
	str += '<p>Draggable links - javascript (adds dynamic date at time of click; title: X_date). You have to drag these to bookmarks before you can click!</p>\n';
	bms['Folder'] = href+"?"+auStr;
	bms['+doc'] = jster(baseURL+'document'+create+'&title='+'Notes ',titlePrefix);
	str += linkster('+doc',bms['+doc']);
	bms['+sheet'] = jster(baseURL+'spreadsheets'+create+'&title='+'Sheet ',titlePrefix);
	str += linkster('+sheet',bms['+sheet']);
	bms['+pres'] = jster(baseURL+'presentation'+create+'&title='+'Slides  ',titlePrefix);
	str += linkster('+pres',bms['+pres']);
	bms['+draw'] = jster(baseURL+'drawings'+create+'&title='+'Drawing  ',titlePrefix);
	str += linkster('+draw',bms['+draw']);
	bms['+form'] = jster(baseURL+'forms'+create+'&title='+'Form ',titlePrefix);
	str += linkster('+form',bms['+form']);
	if (TID) {
	    bms['+docT'] = jster(baseURL+'document/d/'+TID+'/copy?id='+TID)+
		'&copyCollaborators=false&copyComments=false&usp=docs_web'
		+ copyDestination+'&title='+'Notes ',titlePrefix;
	    str += linkster('+docT',bms['+docT']);
	    str += 'Template: '+linkster('(here)',baseURL+'document/d/'+TID+'/edit')+'You can change this template in "options" above.<br>\n';
	} else {
	    str += strTemplateAvailable;
	};
	str += '<h3>Clickable/draggable links (plain html)</h3>\n';
	str += '<p>These links can be dragged or clicked directly.</p>';
	str += '<h4>Title format: New_Doc '+titlePrefix+'</h4>\n';
	str += linkster('+doc',baseURL+'document'+create+'&title='+'New_Doc'+titlePrefix);
	str += linkster('+sheet',baseURL+'spreadsheets'+create+'&title='+'New_Sheet'+titlePrefix);
	str += linkster('+pres',baseURL+'presentation'+create+'&title='+'New_Slides '+titlePrefix);
	str += linkster('+draw',baseURL+'drawings'+create+'&title='+'New_Drawing '+titlePrefix);
	str += linkster('+form',baseURL+'forms'+create+'&title='+'New_Form '+titlePrefix);
	if (TID) {
	    str += linkster('+docT',baseURL+'document/d/'+TID
			    +'/copy?id='+TID+'&copyCollaborators=false&copyComments=false&usp=docs_web'
			    + copyDestination+'&title='+'Notes '+dstr+' '+titlePrefix);
	    str += 'Template: '+linkster('(here)',baseURL+'document/d/'+TID+'/edit')+'You can change this template in "options" above.<br>\n';
	} else {
	    str += strTemplateAvailable;
	};
	str += '<h4>Title format: Doc '+dstr+' '+titlePrefix+'</h4>\n';
	str += '<p>For use now, with current date, unchanging; title: X_'+dstr+':</p>\n';
	str += linkster('+doc',baseURL+'document'+create+'&title='+'Doc '+dstr+' '+titlePrefix);
	str += linkster('+sheet',baseURL+'spreadsheets'+create+'&title='+'Sheet '+dstr+' '+titlePrefix);
	str += linkster('+pres',baseURL+'presentation'+create+'&title='+'Slides '+dstr+' '+titlePrefix);
	str += linkster('+draw',baseURL+'drawings'+create+'&title='+'Drawing '+dstr+' '+titlePrefix);
	str += linkster('+form',baseURL+'forms'+create+'&title='+'Form '+dstr+' '+titlePrefix);
	if (TID) {
	    str += linkster('+docT',baseURL+'document/d/'+TID+'/copy?id='+TID+'&copyCollaborators=false&copyComments=false'
			    + copyDestination +'&title='+'Notes '+dstr+' '+titlePrefix);
	    str += 'Template: '+linkster('(here)',baseURL+'document/d/'+TID+'/edit')+'You can change this template in "options" above.<br>\n';
	} else {
	    str += strTemplateAvailable;
	};
	//str += '<h4>Folder download</h4><p>Doesnt work in May 2020, apparently worked in 2014.</p>\n';
	//str += linkster('Download folder','https://drive.google.com/uc?export=download&id='+FOLDER_ID+'');
	// str = detailsPanel + str;
	// alert(detailsPanel);
    } else if (href.match(/^https\:\/\/docs\.google\.com/)) {
	$('#prefixPanel').empty();
	$('#buttonPanel').empty();
	$('#templatePanel').empty();
	//$('#optionsbutton').empty();
	$('#optionspanel').empty();
	//detailsPanel += '<p>Source: '+linkster(href,'Google doc/sheet/slide') + '</p>\n';
	//detailsPanel += "</div>";
	str += '<h2>Export Docs/Sheets/Slides</h2>\n';
	//str += '<p>Export:</p>\n';
	var re = '/d/([^\/]+)';
	var found = href.match(re);
	var FILE_ID = found[1];
	var formats = [];
	var type = '';
	if (href.match('/document|spreadsheets/')) {
	    pagetype = 'docs';	  
	    var gid = '';
	    var gidx = '';
	    if (href.match('/document/')) {
		formats = ['doc','odt','rtf','pdf','txt','html','epub'];
		type = 'document';
	    } else if (href.match('/spreadsheets/')) {
		type = 'spreadsheets';
		formats = ['xlsx','ods','pdf','csv','tsv'];
		var re = /gid=(\d+)/i;
		var found = href.match(re);
		if (found) {
		    formats = ['xlsx','ods','pdf','csv','tsv'];
		    gid = '(sheet: '+found[1]+') ';
		    gidx = '&'+found[0];
		} else {
		}
		for (var i = 0; i < formats.length; i++) {
		    var thislink = 'https://docs.google.com/'+type+'/d/'+FILE_ID+'/export?'+auStr+'format='+formats[i]+gidx;
		    str += linkster('Export this Google '+type+' '+gid+'as '+formats[i],thislink);
		}
		formats = ['xlsx','ods','pdf'];
		gid = '(all sheets) ';
		gidx = '';
	    }
	    for (var i = 0; i < formats.length; i++) {
		var thislink = 'https://docs.google.com/'+type+'/d/'+FILE_ID+'/export?'+auStr+'format='+formats[i]+gidx;
		str += linkster('Export this Google '+type+' '+gid+'as '+formats[i],thislink);
		for(smode in modelink){
		    var scriptmode = new RegExp(smode, 'i');
		    if (formats[i].match(scriptmode)) {
			modelink[smode] = thislink;
		    };
		};
	    }
	} else if (href.match('/presentation/')) {
	    type = 'presentation';
	    formats = ['pptx','odp','pdf','txt'];
	    for (var i = 0; i < formats.length; i++) {
		var thislink = 'https://docs.google.com/'+type+'/d/'+FILE_ID+'/export/'+formats[i]+'?'+auStr;
		str += linkster('Export this Google '+type+' as '+formats[i],thislink);
		for(smode in modelink){
		    var scriptmode = new RegExp(smode, 'i');
		    if (formats[i].match(scriptmode)) {
			modelink[smode] = thislink;
		    };
		};
	    }
	    str += '<p>Additional formats (jpg, png, svg) cannot be downloaded by '+
		linkster("https://stackoverflow.com/questions/31662455/how-to-download-google-slides-as-images","an extension")
		+'.</p>';
	    // Poss via apps script: https://stackoverflow.com/questions/31662455/how-to-download-google-slides-as-images
	}
	xstr = "";
	if (type === '') {
	    str += 'This extension only works on Google Drive/Docs/Sheet/Presentations pages. Visit such a page and run the extention again. (Error: No type detected.)';
	} else {
	    xstr = "<div id=\"quickdownload\"><p>Quick download (any open doc): ";
	    for(smode in modelink){
		xstr += '['+linkster(smode,modelink[smode],"_new") + ']'+" "   ; // + modelink[smode];
	    };
	    xstr = xstr + "</p></div>";
	};
	// Well prob want to do a 'add bookmarks' here as well...
	// str = detailsPanel + xstr + str;
	str = xstr + str;
    } else {	    
	str = "";
	$('#buttonPanel').empty();
	$('#breakoutPanel').empty();
	$('#optionspanel').empty();
	$('#options').empty();
	str += '<div id="error">This is extension is designed to run on Google Drive / Docs / Sheets / Presentations pages. Please visit a folder in '+
	    linkster("https://drive.google.com","Google Drive") + ' or a Google Docs /Sheets / Presentation and try again.</div>';
    };
    return str;
};

function newPage(str) {
    var o=window.open('output.html','_blank'); 
    var newdoc=o.document; 
    newdoc.write(str); 
    newdoc.close();
};

function newText(str) {
    var w=window.open('output.txt','_blank'); 
    w.document.open("text/plain","replace"); 
    w.document.write(str); 
    w.document.close();
};

function myBookmarklet() {
    if (pagetype == 'docs' && scriptmode != '' && modelink != '' && smode != '') {
	window.open(modelink,'_blank'); 
    } else {
	newPage();
    };
};

//--TO_HERE
