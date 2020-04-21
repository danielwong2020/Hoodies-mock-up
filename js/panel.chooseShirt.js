// -------------------------------------------------------------------------
// <copyright company="BrainStation 23 Ltd.">
//     Copyright (c) 2016 [BrainStation 23 Ltd.](http://brainstation-23.com/)
// </copyright>
// <updated>29-04-2016</updated>
// <author>Mahbubur Rahman Manik</author>
// -------------------------------------------------------------------------

var pathFills = {};
var neckPathFills = {};
var sides = ['F', 'R', 'B', 'L'];

(function (extend) {
    extend.selectedTShirt= {color: 'Blue', side: '', style: 'Basic', neck: 'Neck1'};
    extend.changeTShirtColor = function (color) {
        var stripe = $('#stylePathList')[0].selectedIndex;

        if(stripe != null)
        {
            var style = this.selectedTShirt.style;
            if(!(style in pathFills))
            {
                pathFills[style] = [];
            }

            pathFills[style][stripe] = color;
            this.updateTShirt();
        }
    };
    extend.changeTShirtSide = function (sideName, complete) {
        if(this.selectedTShirt.side == sideName)
        {
            return;
        }
        
        if(sideName == 'Next')
        {
            sideName = sides[(sides.indexOf(this.selectedTShirt.side) + 1) % 5];
        }
        else if(sideName == 'Prev')
        {
            sideName = sides[(sides.indexOf(this.selectedTShirt.side) + 4) % 5];
        }


        var _canvas = window.canvas;
        var selectedTShirt = this.selectedTShirt;
        if (_canvas.getObjects().length > 0) {
            this.tempDesignData.forEach(function (obj) {
                if (obj.side == selectedTShirt.side)
                    obj.object = _canvas.toJSON();
            })
        }
        else {
            this.tempDesignData.forEach(function (obj) {
                if (obj.side == selectedTShirt.side)
                    obj.object = null;
            })
        }
        _canvas.clear();
        this.tempDesignData.forEach(function (obj) {
            if (obj.side == sideName && obj.object !== null) {
                _canvas.loadFromJSON(JSON.stringify(obj.object));
                _canvas.renderAll();
            }
            return;
        });
                
        var imageSrc = '/Hoodies/HoodiesDesignTool/img/shadow-' + sideName + '.png';
        window.canvas.setOverlayImage(imageSrc, function(){
            window.canvas.renderAll();
            TShirtDesignTool.updateTShirt(complete);
        }, {
            width: window.canvas.getWidth(),
            height: window.canvas.getHeight(),
            top: 0,
            left: 0,
        });
                
        this.selectedTShirt.side = sideName;
    };
    extend.changeTShirtStyle = function(style) {
        if(this.selectedTShirt.style == style)
        {
            return;
        }

        this.selectedTShirt.style = style;
        this.updateTShirt();

        var $pathList = $('#stylePathList').html('');
        var imageSrc = '/Hoodies/HoodiesDesignTool/img/styles/' + this.selectedTShirt.style + '-' + this.selectedTShirt.side + '.svg';

        fabric.loadSVGFromURL(imageSrc, function (objects, options) {
            var obj = fabric.util.groupSVGElements(objects, options);

            for (var i = 0; i < obj.paths.length; i++) {
                var option = '<option value=' + i + ' >Stripe ' + i + '</option>';
                $pathList.append(option);
            }
        })
    };
    extend.changeTShirtNeck = function(neck) {
        if(this.selectedTShirt.neck == neck)
        {
            return;
        }

        this.selectedTShirt.neck = neck;
        
        var $pathList = $('#neckPathList').html('');
        var imageSrc = '/Hoodies/HoodiesDesignTool/img/styles/' + neck + '-' + this.selectedTShirt.side + '.svg';
        
        if(this.selectedTShirt.side == 'S')
        {
            imageSrc = '/Hoodies/HoodiesDesignTool/img/styles/empty.svg';
        }
        else
        {
            this.updateTShirt();
            fabric.loadSVGFromURL(imageSrc, function (objects, options) {
                var obj = fabric.util.groupSVGElements(objects, options);
    
                for (var i = 0; i < obj.paths.length; i++) {
                    var option = '<option value=' + i + ' >Stripe ' + i + '</option>';
                    $pathList.append(option);
                }
            })
        }

    };
    extend.changeNeckColor = function (color) {
        if(this.selectedTShirt.side == 'S')
        {
            return;
        }

        var stripe = $('#neckPathList')[0].selectedIndex;

        if(stripe != null)
        {
            var neck = this.selectedTShirt.neck;

            if(!(neck in neckPathFills))
            {
                neckPathFills[neck] = [];
            }
            neckPathFills[neck][stripe] = color;

            this.updateTShirt();
        }
    };
    extend.updateTShirt = function(complete) {
        var imageSrc = '/Hoodies/HoodiesDesignTool/img/styles/' + this.selectedTShirt.style + '-' + this.selectedTShirt.side + '.svg';
        var neckSrc = '/Hoodies/HoodiesDesignTool/img/styles/' + this.selectedTShirt.neck + '-' + this.selectedTShirt.side + '.svg';
        var style = this.selectedTShirt.style;
        var side = this.selectedTShirt.side;
        var neck = this.selectedTShirt.neck;
        var $canvasContainer = $('.canvas-container').addClass('loading');

        if(side == 'S')
        {
            neckSrc = '/Hoodies/HoodiesDesignTool/img/styles/empty.svg';
        }

        fabric.loadSVGFromURL(imageSrc, function (objects, options) {
            var obj = fabric.util.groupSVGElements(objects, options);

            if(style in pathFills)
            {
                for(var i in pathFills[style])
                {
                    if(obj.paths[i] && pathFills[style][i])
                    {
                        obj.paths[i].fill = pathFills[style][i];
                    }
                }
            }

            fabric.loadSVGFromURL(neckSrc, function(objects, options){
                var obj2 = fabric.util.groupSVGElements(objects, options);
                obj.paths = obj.paths.concat(obj2.paths);

                if(side != 'S' && neck in neckPathFills)
                {
                    for(var i in neckPathFills[neck])
                    {
                        if(obj2.paths[i] && neckPathFills[neck][i])
                        {
                            obj2.paths[i].fill = neckPathFills[neck][i];
                        }
                    }
                }

                obj.setOptions({
                    width: 100,
                    height: 100
                })
    
                window.canvas.setBackgroundImage(obj, function(){
                    window.canvas.renderAll();
                    $canvasContainer.removeClass('loading');
                    if(typeof complete == 'function')
                    {
                        complete();
                    }
                }, {
                    left: 0,
                    top: 0,
                    scaleX: window.canvas.width / options.width,
                    scaleY: window.canvas.height / options.height,
                });
            })

        })
    };
    extend.updateTShirtPaths = function() {

    };
    extend.showTShirtCollection= function () {
        // not implemented yet
        // will show the collection of shirts

    };
})(TShirtDesignTool);