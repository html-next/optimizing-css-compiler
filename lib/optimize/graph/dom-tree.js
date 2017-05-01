class Node {
  constructor(reference, parent = null) {
    this.reference = reference;
    this.parent = parent;
    this._children = null;
    this._classNames = null;
  }

  get attributes() {
    let type = this.type;

    if (type === 'MustacheStatement' || type === 'BlockStatement') {
      return this.reference.hash.pairs;
    }
    return this.reference.attributes || [];
  }

  get classNames() {
    let classNames = this._classNames;

    if (classNames === null) {
      let potentialClassNames = [];
      let attributes = this.attributes;

      attributes.forEach((attr) => {
        if (attr.name === 'class') {
          if (attr.value.type === 'TextNode') {
            let availableClassNames = attr.value.chars.split(' ');
            availableClassNames = availableClassNames.map(n => `.${n}`);
            potentialClassNames.push(...availableClassNames);
          }
        } else if (attr.key === 'class') {
          if (attr.value.type === 'StringLiteral') {
            let availableClassNames = attr.value.value.split(' ');
            availableClassNames = availableClassNames.map(n => `.${n}`);
            potentialClassNames.push(...availableClassNames);
          }
        }
      });

      if (potentialClassNames.length) {
        classNames = this._classNames = potentialClassNames;
      } else {
        classNames = this._classNames = [];
      }

    }

    return classNames;
  }

  get tag() {
    let type = this.type;

    if (type === 'MustacheStatement' || type === 'BlockStatement') {
      return this.reference.path.original;
    }
    return this.reference.tag || 'document';
  }

  get type() {
    return this.reference.type;
  }

  get children() {
    let children = this._children;

    if (children === null) {
      let potentialChildren = [];
      let ref = this.reference;
      let type = this.type;

      if (type === 'Program') {
        ref.body.forEach((entry) => {
          addIfAllowedType(potentialChildren, entry, this);
        });
      } else if (type === 'ElementNode') {
        ref.children.forEach((entry) => {
          addIfAllowedType(potentialChildren, entry, this);
        });
      } else if (type === 'BlockStatement' || type === 'MustacheStatement') {
        if (ref.program) {
          ref.program.body.forEach((entry) => {
            addIfAllowedType(potentialChildren, entry, this);
          });
        }
      } else {
        throw new Error('Unknown Ability to Walk');
      }

      if (potentialChildren.length) {
        children = this._children = potentialChildren;
      } else {
        children = this._children = [];
      }
    }

    return children;
  }

  visit(cb) {
    cb(this);
    let children = this.children;
    children.forEach((child) => {
      child.visit(cb);
    });
  }

  toJSON() {
    let children = this.children;
    return {
      tag: this.tag,
      classNames: this.classNames,
      children: children.map(c => c.toJSON())
    };
  }
}

const ALLOWED_TYPES = ['ElementNode', 'BlockStatement', 'MustacheStatement'];

function addIfAllowedType(array, entry, parent) {
  let type = entry.type;

  if (ALLOWED_TYPES.indexOf(type) !== -1) {
    array.push(new Node(entry, parent));
  } else {
    // console.log('unknown type', entry.type);
  }
}

module.exports = Node;
