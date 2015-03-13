var TrNgGrid;
(function (TrNgGrid) {
    function processMonitorChanges(source, propKeys, onChangeDetected) {
        debugger;
        var newData = {};
        var sourceIsArrayOfValues = source instanceof Array;
        angular.forEach(propKeys, function (propKey, index) {
            var propValue = sourceIsArrayOfValues ? source[index] : source[propKey];
            if (propValue !== undefined) {
                if (propValue === "true") {
                    propValue = true;
                }
                else if (propValue === "false") {
                    propValue = false;
                }
                if (propValue.toString().indexOf("{{") === 0) {
                    throw "Invalid property value detected";
                }
                newData[propKey] = propValue;
            }
        });
        onChangeDetected(newData);
    }
    ;
    function monitorAttributes($interpolate, $tAttrs, $scope, properties, onChangeDetected) {
        var propKeys;
        if (properties instanceof Array) {
            propKeys = properties;
        }
        else {
            propKeys = extractFields(properties);
        }
        var watchArray = new Array(propKeys.length);
        angular.forEach(propKeys, function (propKey, index) {
            watchArray[index] = $interpolate($tAttrs[propKey])($scope);
        });
        debugger;
        $scope.$watchGroup(watchArray, function (newValues) { return processMonitorChanges(newValues, propKeys, onChangeDetected); });
    }
    TrNgGrid.monitorAttributes = monitorAttributes;
    function monitorScope($scope, properties, onChangeDetected) {
        var propKeys;
        if (properties instanceof Array) {
            propKeys = properties;
        }
        else {
            propKeys = extractFields(properties);
        }
        $scope.$watchGroup(propKeys, function () { return processMonitorChanges($scope, propKeys, onChangeDetected); });
    }
    TrNgGrid.monitorScope = monitorScope;
    function extractFields(data) {
        var fields = new Array();
        for (var fieldName in data) {
            fields.push(fieldName);
        }
        return fields;
    }
    TrNgGrid.extractFields = extractFields;
    function findChildByTagName(parent, childTag) {
        childTag = childTag.toUpperCase();
        var children = parent.children();
        for (var childIndex = 0; childIndex < children.length; childIndex++) {
            var childElement = children[childIndex];
            if (childElement.tagName === childTag) {
                return angular.element(childElement);
            }
        }
        return null;
    }
    TrNgGrid.findChildByTagName = findChildByTagName;
    ;
    function findChildIndex(child) {
        var parent = child.parent();
        var children = parent.children();
        var childIndex = 0;
        for (; childIndex < children.length && children[childIndex] === child[0]; childIndex++)
            ;
        return (childIndex >= children.length) ? -1 : childIndex;
    }
    TrNgGrid.findChildIndex = findChildIndex;
    ;
    function findChildrenByTagName(parent, childTag) {
        childTag = childTag.toUpperCase();
        var retChildren = new Array();
        var children = parent.children();
        for (var childIndex = 0; childIndex < children.length; childIndex++) {
            var childElement = children[childIndex];
            if (childElement.tagName === childTag) {
                retChildren.push(angular.element(childElement));
            }
        }
        return retChildren;
    }
    TrNgGrid.findChildrenByTagName = findChildrenByTagName;
    ;
    function wrapTemplatedCell(templateElement, cellTemplateDirective) {
        var childrenElements = templateElement.children();
        if (childrenElements.length !== 1 || !angular.element(childrenElements[0]).attr(cellTemplateDirective)) {
            var templateWrapElement = angular.element("<div>" + templateElement.html() + "</div>").attr(cellTemplateDirective, "");
            templateElement.empty();
            templateElement.append(templateWrapElement);
        }
    }
    TrNgGrid.wrapTemplatedCell = wrapTemplatedCell;
    ;
    function log(message) {
        console.log(TrNgGrid.Constants.tableDirective + "(" + new Date().getTime() + "): " + message);
    }
    TrNgGrid.log = log;
    ;
    function createRowElement() {
        return findChildByTagName(findChildByTagName(angular.element("<table><tbody><tr></tr></tbody></table>"), "tbody"), "tr");
    }
    TrNgGrid.createRowElement = createRowElement;
    function createCellElement(cellTagName) {
        return findChildByTagName(findChildByTagName(findChildByTagName(angular.element("<table><tbody><tr><" + cellTagName + "></" + cellTagName + "></tr></tbody></table>"), "tbody"), "tr"), cellTagName);
    }
    TrNgGrid.createCellElement = createCellElement;
    function fixGridCell(gridConfiguration, cellElement, cellTagName, cellElementDirectiveAttribute) {
        if (!cellElement) {
            cellElement = createCellElement(cellTagName);
            cellElement.attr(TrNgGrid.Constants.dataColumnIsAutoGeneratedAttribute, "true");
        }
        cellElement.attr(cellElementDirectiveAttribute, "");
        var cellChildrenElements = cellElement.children();
        var isCustomized = cellChildrenElements.length || ((cellElement.html().replace(/^\s+|\s+$/gm, '')));
        if (isCustomized && cellChildrenElements.length === 0) {
            var wrappedContent = angular.element("<div>" + cellElement.html() + "</div>");
            cellElement.empty();
            cellElement.append(wrappedContent);
        }
        if (isCustomized) {
            cellElement.attr(TrNgGrid.Constants.dataColumnIsCustomizedAttribute, "true");
        }
        return cellElement;
    }
    TrNgGrid.fixGridCell = fixGridCell;
    function fixGridSection(gridConfiguration, sectionElement, rowElementDirectiveAttribute, cellTagName, cellElementDirectiveAttribute) {
        var rowElement;
        var rowElements = findChildrenByTagName(sectionElement, "tr");
        if (!rowElements.length) {
            sectionElement.empty();
            rowElement = createRowElement();
            sectionElement.append(rowElement);
            rowElements.push(rowElement);
        }
        for (var rowIndex = 0; rowIndex < rowElements.length; rowIndex++) {
            rowElement = rowElements[rowIndex];
            rowElement.attr(rowElementDirectiveAttribute, "");
            var cellElements = findChildrenByTagName(rowElement, cellTagName);
            if (cellElements.length === 0 || !cellElements[0].attr(TrNgGrid.Constants.headerCellPlaceholderDirectiveAttribute)) {
                var placeholderTemplate = angular.element(gridConfiguration.templates.headerCellStandard);
                placeholderTemplate.attr("data-ng-repeat", "gridColumnLayout in (gridLayoutRow.cells)");
                placeholderTemplate.attr("data-ng-if", "!gridColumnLayout.isDeactivated");
                placeholderTemplate.attr(TrNgGrid.Constants.headerCellPlaceholderDirectiveAttribute, "");
                rowElement.prepend(placeholderTemplate);
            }
            for (var cellIndex = 0; cellIndex < cellElements.length; cellIndex++) {
                var cellElement = cellElements[cellIndex];
                fixGridCell(gridConfiguration, cellElement, cellTagName, cellElementDirectiveAttribute);
            }
        }
    }
    TrNgGrid.fixGridSection = fixGridSection;
    function fixTableStructure(gridConfiguration, gridElement) {
        var tableHeaderElement = findChildByTagName(gridElement, "thead");
        if (!tableHeaderElement) {
            tableHeaderElement = findChildByTagName(angular.element("<table><thead></thead></table"), "thead");
            gridElement.prepend(tableHeaderElement);
        }
        tableHeaderElement.attr(TrNgGrid.Constants.headerDirectiveAttribute, "");
        fixGridSection(gridConfiguration, tableHeaderElement, TrNgGrid.Constants.headerRowDirectiveAttribute, "th", TrNgGrid.Constants.headerCellDirectiveAttribute);
        var tableFooterElement = findChildByTagName(gridElement, "tfoot");
        if (!tableFooterElement) {
            tableFooterElement = findChildByTagName(angular.element("<table><tfoot></tfoot></table"), "tfoot");
            tableHeaderElement.after(tableFooterElement);
        }
        var tableBodyElement = findChildByTagName(gridElement, "tbody");
        if (!tableBodyElement) {
            tableBodyElement = findChildByTagName(angular.element("<table><tbody></tbody></table"), "tbody");
            tableFooterElement.after(tableBodyElement);
        }
        angular.forEach(gridElement.children, function (element) {
            if (element !== tableHeaderElement[0] || element !== tableBodyElement[0] || element !== tableFooterElement[0]) {
                angular.element(element).remove();
                gridConfiguration.debugMode && log("Invalid extra element found inside the grid template structure: " + element.tagName);
            }
        });
    }
    TrNgGrid.fixTableStructure = fixTableStructure;
})(TrNgGrid || (TrNgGrid = {}));
