// -------------------------------------------------------------------------
// <copyright company="BrainStation 23 Ltd.">
//     Copyright (c) 2016 [BrainStation 23 Ltd.](http://brainstation-23.com/)
// </copyright>
// <updated>29-04-2016</updated>
// <author>Mahbubur Rahman Manik</author>
// -------------------------------------------------------------------------

var TShirtDesignTool = ( function () {

    var _canvasInit = function () {

        // Initialization of fabric canvas
        window.canvas = new fabric.Canvas('canvas');
        canvas.setHeight($('#canvas-container').height());
        canvas.setWidth($('#canvas-container').width());
        
        canvas.on('object:added', function (e) {
            var obj = e.target;

            if (obj.id === 'customName' || obj.id === 'customNumber') {
                obj.on('selected', function () {
                    TShirtDesignTool.showPersonalizationPanel();
                });
                return;
            }
            if (TShirtDesignTool.isUndoMode) {
                TShirtDesignTool.undoObjects.push({
                    operation: 'added',
                    object: obj
                });
            }
            if (!TShirtDesignTool.isUndoMode) {
                TShirtDesignTool.redoObjects.push({
                    operation: 'added',
                    object: obj
                });
            }
            if (obj.type === 'text' || obj.type === 'curvedText') {
                obj.on('selected', function () {
                    TShirtDesignTool.textEditorPanel(obj);
                });
            }
            if (obj.type === 'path-group') {
                obj.on('selected', function () {
                    $('#pathList').html('');
                    for (var i = 0; i < obj.paths.length; i++) {
                        var option = '<option value=' + i + ' >Path ' + i + '</option>';
                        $('#pathList').append(option);
                    }
                    TShirtDesignTool.clipartEditorPanel();
                });
            }
        });

        canvas.on('object:removed', function (e) {
            var obj = e.target;
            if (TShirtDesignTool.isUndoMode) {
                TShirtDesignTool.undoObjects.push({
                    operation: 'deleted',
                    object: obj
                });
            }
            if (!TShirtDesignTool.isUndoMode) {
                TShirtDesignTool.redoObjects.push({
                    operation: 'deleted',
                    object: obj
                });
            }

            if(obj)
            {
                _changePanelOnRemove(obj);
            }
        });

        canvas.on('mouse:down', function (e) {
            if (e.target === undefined) {
                _changePanelOnRemove(TShirtDesignTool.laswtSelectedObject);
            }
        });

        canvas.on('object:selected', function (e) {
            TShirtDesignTool.lastSelectedObject = e.target;
        });

        document.onkeydown = function (e) {
            if (46 === e.keyCode || e.keyCode === 110) {
                var activeObject = window.canvas.getActiveObject();
                if (activeObject) {
                    window.canvas.remove(activeObject).renderAll();
                }
            }
        }
    };
    var _boundObjectOnCanvas = function () {

        // feature is currently unused
        window.canvas.on('object:moving', function (e) {
            var obj = e.target;
            // if object is too big ignore
            if (obj.currentHeight > obj.canvas.height || obj.currentWidth > obj.canvas.width) {
                return;
            }
            obj.setCoords();
            // top-left  corner
            if (obj.getBoundingRect().top < 0 || obj.getBoundingRect().left < 0) {
                obj.top = Math.max(obj.top, obj.top - obj.getBoundingRect().top);
                obj.left = Math.max(obj.left, obj.left - obj.getBoundingRect().left);
            }
            // bot-right corner
            if (obj.getBoundingRect().top + obj.getBoundingRect().height > obj.canvas.height || obj.getBoundingRect().left + obj.getBoundingRect().width > obj.canvas.width) {
                obj.top = Math.min(obj.top, obj.canvas.height - obj.getBoundingRect().height + obj.top - obj.getBoundingRect().top);
                obj.left = Math.min(obj.left, obj.canvas.width - obj.getBoundingRect().width + obj.left - obj.getBoundingRect().left);
            }
        });

    };
    var _undo = function () {

        TShirtDesignTool.isUndoMode = false;
        if (TShirtDesignTool.undoObjects.length > 0) {
            var object = TShirtDesignTool.undoObjects.pop();
            if (object) {
                if (object.operation === 'added') {
                    window.canvas.remove(object.object);
                    if (object.object.type === 'text') {
                        TShirtDesignTool.showPanel('text-panel');
                        $('#text-panel textarea').val('');
                    }
                    if (object.object.type === 'path-group') {
                        TShirtDesignTool.showPanel('clip-art-panel');
                    }
                }
                if (object.operation === 'deleted') {
                    window.canvas.add(object.object);
                }
            }
        }
        TShirtDesignTool.isUndoMode = true;
    };
    var _redo = function () {

        TShirtDesignTool.isUndoMode = true;
        if ( TShirtDesignTool.redoObjects && TShirtDesignTool.redoObjects.length > 0) {
            var object = TShirtDesignTool.redoObjects.pop();
            if (object) {
                if (object.operation === 'added') {
                    window.canvas.remove(object.object);
                }
                if (object.operation === 'deleted') {
                    window.canvas.add(object.object);
                }
            }
        }
        //TShirtDesignTool.isUndoMode=true;
    };
    var _changePanelOnRemove = function (target) {
        if (target && (target.type === 'text' || target.type === 'curvedText')) {
            // TShirtDesignTool.showPanel('text-panel');
            // $('#text-panel textarea').val('');
        }
        else if (target && target.type === 'path-group') {
            TShirtDesignTool.showPanel('clip-art-panel');
        }
        else if (target && target.type === 'image') {
            TShirtDesignTool.showPanel('upload-image-panel');
        }
        else {
            TShirtDesignTool.showPanel('chooseTShirtPanel');
        }
    };

    return {
        init: function () {
            _canvasInit();
            // All Event binding goes here

            $('#text-panel a').click(function (e) {
                TShirtDesignTool.drawText();
            });

            $('#textArea').keyup(function (e) {
                TShirtDesignTool.updateText(e.target.value);
            });

            $("#btnChooseShirt").click(function (e) {
                TShirtDesignTool.showPanel('chooseTShirtPanel');
                TShirtDesignTool.isPersonalizationMode = false;
            });

            $("#btnAddText").click(function (e) {
                TShirtDesignTool.showPanel('text-panel');
                $('#text-panel textarea').val('');
                TShirtDesignTool.isPersonalizationMode = false;
            });

            $("#btnAddclipart").click(function (e) {
                TShirtDesignTool.showPanel('clip-art-panel');
                TShirtDesignTool.isPersonalizationMode = false;
            });

            $("#btnUploadImage").click(function (e) {
                TShirtDesignTool.showPanel('upload-image-panel');
            });

            $("#btnPersonalize").click(function (e) {
                // TShirtDesignTool.showPanel('personalization-panel');
                // TShirtDesignTool.isPersonalizationMode = true;
                // TShirtDesignTool.showPersonalizationPopup();
            });

            $('#enableName').on('click', function(){
                $('.persNameInput').prop('disabled', !$(this).prop('checked'))
            })

            $('#enableNum').on('click', function(){
                $('.persNumInput').prop('disabled', !$(this).prop('checked'))
            })

            $("#btnSaveDesign").click(function (e) {
                TShirtDesignTool.isPersonalizationMode = false;
                setFinalDesign();
            });

            $('#textSpacing,#fontSizing,#textCircular,#textOutline,#pathList,#upload-image,#import-design').change(function (e) {
                switch (e.target.id) {
                    case 'textSpacing':
                        TShirtDesignTool.setTextSpacing(textSpacing.value);
                        break;
                    case 'fontSizing':
                        TShirtDesignTool.setFontSize();
                        break;
                    case 'textCircular':
                        TShirtDesignTool.setTextCircular();
                        break;
                    case 'textOutline':
                        TShirtDesignTool.setOutline();
                        break;
                    case 'pathList':
                        TShirtDesignTool.svgPathChange();
                        break;
                    case 'upload-image':
                        TShirtDesignTool.uploadImage(e);
                        ;
                        break;
                    case 'import-design':
                        TShirtDesignTool.importDesign(e);
                        break;
                }

            });

            $('#textArcSlider').slider({
                orientation: "horizontal",
                range: "min",
                min: -107,
                max: 108,
                value: 0,
                slide: function (event, ui) {
                    return TShirtDesignTool.setTextArc(ui.value);
                }
            });

            $('#svgAngle').slider({
                orientation: "horizontal",
                range: "min",
                min: -1,
                max: 361,
                value: 0,
                slide: TShirtDesignTool.setSvgAngle
            });

            $('#svgOpacity').slider({
                orientation: "horizontal",
                range: "min",
                min: 0,
                max: 100,
                value: 100,
                slide: TShirtDesignTool.setSvgOpacity
            });

            $("#text-outline-slider").slider({
                orientation: "horizontal",
                range: "min",
                max: 100,
                value: 0,
                slide: function (event, ui) {
                    return TShirtDesignTool.setOutlineWidth(ui.value * .01);
                }

            });

            $("#text-color,#text-outline-color,#svgFill,#numberColor,#nameColor").spectrum({
                showPaletteOnly: true,
                togglePaletteOnly: true,
                hideAfterPaletteSelect: true,
                togglePaletteMoreText: 'more',
                togglePaletteLessText: 'less',
                color: 'gray',
                palette: [
                    ["#000", "#444", "#666", "#999", "#ccc", "#eee", "#f3f3f3", "#fff"],
                    ["#f00", "#f90", "#ff0", "#0f0", "#0ff", "#00f", "#90f", "#f0f"],
                    ["#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#cfe2f3", "#d9d2e9", "#ead1dc"],
                    ["#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#9fc5e8", "#b4a7d6", "#d5a6bd"],
                    ["#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6fa8dc", "#8e7cc3", "#c27ba0"],
                    ["#c00", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3d85c6", "#674ea7", "#a64d79"],
                    ["#900", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#0b5394", "#351c75", "#741b47"],
                    ["#600", "#783f04", "#7f6000", "#274e13", "#0c343d", "#073763", "#20124d", "#4c1130"]
                ]
            });

            $("#text-color,#text-outline-color,#svgFill,#nameColor,#numberColor").change(function (e) {
                var parentID = e.target.id,
                    color = $('#' + parentID + '').spectrum("get").toHexString();
                switch (parentID) {
                    case 'svgFill':
                        TShirtDesignTool.setSvgPathColor(color);
                        break;
                    case 'text-color':
                        TShirtDesignTool.setTextColor(color);
                        break;
                    case 'text-outline-color':
                        TShirtDesignTool.setOutlineColor(color);
                        break;
                    case 'nameColor':
                        TShirtDesignTool.setPersonalizedNameColor(color);
                        break;
                    case 'numberColor':
                        TShirtDesignTool.setPersonalizedNumberColor(color);
                        break;
                }
            });

            $('#font-style').ddslick({
                data: TShirtDesignTool.fontStyleData,
                width: 190,
                imagePosition: "left",
                selectText: "Select font style",
                onSelected: function (data) {
                    //console.log(data);
                    TShirtDesignTool.setFontStyle(data.selectedData.text);
                }
            });

            $('#font-family').ddslick({
                data: TShirtDesignTool.fontFamilyData,
                width: 300,
                selectText: "Select font family",
                onSelected: function (data) {
                    //console.log(data)
                    TShirtDesignTool.setTextFontFamily(data.selectedData.value);
                }
            });

            $('#clip-art-panel img').click(function (e) {
                TShirtDesignTool.addClipartToCanvas(e.target.src);
            });

            $('.ThumbImg').click(function (e) {
                TShirtDesignTool.changeTShirtSide(e.target.alt);
            });

            $('.prevSideBtn').on('click', function(){
                TShirtDesignTool.changeTShirtSide('Prev');
            });

            $('.nextSideBtn').on('click', function(){
                TShirtDesignTool.changeTShirtSide('Next');
            });

            $('.tshirt-style').click(function (e) {
                TShirtDesignTool.changeTShirtStyle(e.target.dataset['style']);
            });

            $('.neck-style').click(function (e) {
                TShirtDesignTool.changeTShirtNeck(e.target.dataset['style']);
            });

            $('#btnSave').click(function () {
                TShirtDesignTool.saveDesign();
            });

            $('#btnCancel').click(function () {
                $('#save-design-popup').foundation('reveal', 'close');
            });

            $('#changeShirtBtn').click(function (e) {
                TShirtDesignTool.showTShirtCollection();
            });

            $('#chooseTShirtPanel .shirt-color-pick').click(function (e) {
                TShirtDesignTool.changeTShirtColor(e.target.style.backgroundColor);
            });

            $('#chooseTShirtPanel .neck-color-pick').click(function (e) {
                TShirtDesignTool.changeNeckColor(e.target.style.backgroundColor);
            });

            $('#save-design-popup').on('submit', function(){
                var designs = [];
                var $btn = $('#btnSendEmail');

                if($btn.hasClass('disabled'))
                {
                    return;
                }

                $('.final-img').each(function(){
                    designs.push({
                        name: $(this).attr('data-name') + '.png',
                        data: $(this).attr('src')
                    });
                })
                
                var emailAddress = $('.emailAddress').val();
                var phone = $('.emailPhone').val();
                var name = $('.emailName').val();
                var club = $('.emailClub').val();
                var comment = $('.emailComment').val();
                var qty = $('.emailQty').val().toString();

                var msgBody = 'You have a new design request from ' + name + ':<br>E-mail address: ' + emailAddress + '<br>Club name: ' + club + '<br>Phone number: ' + phone + '<br>Quantity: ' + qty + '<br>Comment: ' + comment + '<br>';

                if(TShirtDesignTool.persData && TShirtDesignTool.persData.length > 0 && TShirtDesignTool.persSettings)
                {
                    var data = TShirtDesignTool.persData;
                    var settings = TShirtDesignTool.persSettings;
                    msgBody += '<style>table td {border: 1px solid #000000}</style>';
                    msgBody += '<table><thead><th>Name</th><th>Number</th><th>Size</th></thead><tbody>';

                    for(var i in data)
                    {
                        var line = data[i];

                        msgBody += '<tr><td>' + line.name + '</td><td>' + line.number + '</td><td>' + line.size  + '</td></tr>';
                    }

                    msgBody += '</tbody></table><br>';

                    if(settings.enableName)
                    {
                        msgBody += 'Name settings: <br> Color: ' + settings.nameColor + '<br>Side: ' + (settings.nameSide == 'B' ? 'Back' : 'Front') + '<br>Inches: ' + settings.nameInch + '<br><br>';
                    }

                    if(settings.enableNumber)
                    {
                        msgBody += 'Number settings: <br> Color: ' + settings.numberColor + '<br>Side: ' + (settings.numberSide == 'B' ? 'Back' : 'Front') + '<br>Inches: ' + settings.numberInch + '<br><br>';
                    }
                }

                if(window.customImages && window.customImages.length > 0)
                {
                    for(var i in window.customImages)
                    {
                        designs.push({
                            name: 'customImage_' + i + '.png',
                            data: window.customImages[i]
                        })
                    }
                }

                $btn.val('Sending...').addClass('disabled')

                Email.send({
                    Host: 'mail.xsportstore.com',
                    Username: 'notifications@xsportstore.com',
                    Password: 'notifications',
                    // To : 'tofik309@gmail.com',
                    To : 'daniel.wong@evigtro.com.hk',
                    From : emailAddress,
                    Subject : "Design for " + club,
                    Body : msgBody,
                    Attachments: designs
                }).then(
                    function(message){
                        $btn.val('Send email').removeClass('disabled');
                        console.log(message);
                    }
                );

                return false;
            })

            $('.shirtQty').on('change', function(){
                if(parseInt($(this).val()) < 20)
                $(this).val(20);
            });


            $('#addName,#addNumber,#nameInch,#numberInch').change(function (e) {
                switch (e.currentTarget.id) {
                    case 'addName':
                        addName.checked ? TShirtDesignTool.addPersonalizedName()
                            : TShirtDesignTool.removePersonalizedName();
                        break;
                    case 'addNumber':
                        addNumber.checked ? TShirtDesignTool.addPersonalizedNumber()
                            : TShirtDesignTool.removePersonalizedNumber();
                        break;
                    case 'nameInch':
                        TShirtDesignTool.setPersonalNameSize(parseFloat(nameInch.value));
                        break;
                    case 'numberInch':
                        TShirtDesignTool.setPersonalNumberSize(parseFloat(numberInch.value));
                        break;
                }

            });

            $("#nameSide,#numberSide").change(function (e) {
                TShirtDesignTool.changeTshirtSideInPersonalizationMode(e.currentTarget.value);
            });

            $('#insertRow').click(function (e) {
                var row = $('#personalizeDataTable tbody tr').last().clone();
                $(row.children()).each(function (item) {
                    switch (item) {
                        case 0:
                            this.innerHTML = parseInt(this.innerHTML) + 1;
                            break;
                        case 1:
                            $(this).children().val('');
                            break;
                        case 2:
                            $(this).children().val('');
                            break;
                    }
                });
                $('#personalizeDataTable tbody').append(row);
            });

            var hexDigits = new Array("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"); 

            //Function to convert rgb color to hex format
            function rgb2hex(rgb) {
                rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
            }

            function hex(x) {
                return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
            }

            $('#savePersonalizeData').on('click', function(){
                var data = [];
                var settings = {};
                var saveName = $('#enableName').prop('checked');
                var saveNum = $('#enableNum').prop('checked');

                settings.enableName = saveName;
                settings.nameColor = rgb2hex($('#nameColor+.sp-replacer .sp-preview-inner').css('background-color'));
                settings.nameSide = $('#nameSide').val();
                settings.nameInch = $('#nameInch').val();

                settings.enableNumber = saveNum;
                settings.numberColor = rgb2hex($('#numberColor+.sp-replacer .sp-preview-inner').css('background-color'));
                settings.numberSide = $('#numberSide').val();
                settings.numberInch = $('#numberInch').val();

                $('.persRow').each(function(){
                    var $this = $(this);
                    var name = '';
                    var number = '';
                    var size = '';

                    var $name = $this.find('.persNameInput');
                    var $number = $this.find('.persNumInput');
                    var $size = $this.find('.persSizeInput');

                    if(saveName && !$name.prop('disabled') && $name.val())
                    {
                        name = $name.val();
                    }

                    if(saveNum && !$number.prop('disabled') && $number.val())
                    {
                        number = $number.val();
                    }

                    if($size[0].selectedIndex > 0)
                    {
                        size = $size.val();
                    }

                    if(name || size || number)
                    {
                        data.push({
                            name: name,
                            number: number,
                            size: size
                        })
                    }
                })

                TShirtDesignTool.persData = data;
                TShirtDesignTool.persSettings = settings;

                // open save
            })

            $("#undoBtn").click(function (e) {
                _undo();
            });

            $("#redoBtn").click(function (e) {
                _redo();
            });

        },
        showPanel : function (panelToshow) {
        TShirtDesignTool.panels.forEach(function (panel) {
            panel === panelToshow ? $('#' + panel).fadeIn(500) : $('#' + panel).hide();
        });
    },
        getCanvasActiveObject : function () {
        return window.canvas.getActiveObject() || window.canvas.item(0);
    },
        panels : [
        'text-panel',
        'editor-panel',
        'clip-art-panel',
        'upload-image-panel',
        'edit-clipart-panel',
        'chooseTShirtPanel',
        'personalization-panel'
    ],
        tempDesignData : [
        {
            side: 'F',
            object: null
        },
        {
            side: 'B',
            object: null
        },
        {
            side: 'L',
            object: null
        },
        {
            side: 'R',
            object: null
        }
    ],
        undoObjects : [],
        redoObjects : [],
        isUndoMode : true,
        isPersonalizationMode : false,
        lastSelectedObject : null,
        showPanel : function (panelToshow) {
        TShirtDesignTool.panels.forEach(function (panel) {
            panel === panelToshow ? $('#' + panel).fadeIn(500) : $('#' + panel).hide();
        });
    }
    };
})();

function setFinalDesign(){
    var designs = {
        'F': null,
        'B': null,
        'L': null,
        'R': null,
        'S': null,
    }

    $('#save-design-popup .final-img').hide();

    window.canvas.setActiveObject(new fabric.Object);
    TShirtDesignTool.changeTShirtSide('S', function(){
        designs['S'] = window.canvas.toDataURL("image/png");

        TShirtDesignTool.changeTShirtSide('B', function(){
            designs['B'] = window.canvas.toDataURL("image/png");

            TShirtDesignTool.changeTShirtSide('L', function(){
                designs['L'] = window.canvas.toDataURL("image/png");

                TShirtDesignTool.changeTShirtSide('R', function(){
                    designs['R'] = window.canvas.toDataURL("image/png");

                    TShirtDesignTool.changeTShirtSide('F', function(){
                        designs['F'] = window.canvas.toDataURL("image/png");

                        $('#save-design-popup .final-f').attr('src', designs['F']);
                        $('#save-design-popup .final-b').attr('src', designs['B']);
                        $('#save-design-popup .final-l').attr('src', designs['L']);
                        $('#save-design-popup .final-r').attr('src', designs['R']);
                        $('#save-design-popup .final-s').attr('src', designs['S']);
                        $('#save-design-popup .final-img').show();
                    });
                });
            });
        });
    });
}


$(document).ready(function () {
    TShirtDesignTool.init();
    
    $(document).foundation();
    TShirtDesignTool.changeTShirtSide('F');
    TShirtDesignTool.changeTShirtStyle('Basic');
    TShirtDesignTool.changeTShirtNeck('Neck1');

    $('.style-slider').slick({
        slidesToShow: 3.5,
        slidesToScroll: 3,
        infinite: false,
        arrows: true,
        prevArrow: '<div class="prev-arrow"></div>',
        nextArrow: '<div class="next-arrow"></div>',
    })

    $('.neck-slider').slick({
        slidesToShow: 3.5,
        slidesToScroll: 3,
        infinite: false,
        arrows: true,
        prevArrow: '<div class="prev-arrow"></div>',
        nextArrow: '<div class="next-arrow"></div>',
    })
});

lazyload = new LazyLoad({
    elements_selector: ".lazy"
});

lazyload.loadAll();