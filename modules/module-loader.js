/**
 * Module Loader for MathJax to LaTeX Extension
 * 
 * This module provides a clean way to load and manage dependencies
 * without polluting the global namespace
 */

(function() {
  'use strict';

  // Module registry
  const modules = {};
  const loadedModules = new Set();
  const pendingCallbacks = [];

  /**
   * Define a module
   * @param {string} name - Module name
   * @param {Array} dependencies - Array of dependency names
   * @param {Function} factory - Module factory function
   */
  function define(name, dependencies, factory) {
    if (typeof name !== 'string') {
      throw new Error('Module name must be a string');
    }

    if (!Array.isArray(dependencies)) {
      factory = dependencies;
      dependencies = [];
    }

    modules[name] = {
      name,
      dependencies,
      factory,
      exports: null,
      loaded: false
    };

    // Try to load the module immediately if all dependencies are ready
    tryLoadModule(name);
  }

  /**
   * Require a module
   * @param {string|Array} deps - Module name(s) to require
   * @param {Function} callback - Callback to execute when modules are loaded
   */
  function require(deps, callback) {
    if (typeof deps === 'string') {
      deps = [deps];
    }

    const resolved = [];
    let pending = deps.length;

    if (pending === 0) {
      callback.apply(null, resolved);
      return;
    }

    deps.forEach((dep, index) => {
      whenModuleLoaded(dep, (module) => {
        resolved[index] = module;
        pending--;
        if (pending === 0) {
          callback.apply(null, resolved);
        }
      });
    });
  }

  /**
   * Try to load a module if all its dependencies are ready
   * @param {string} name - Module name
   */
  function tryLoadModule(name) {
    const module = modules[name];
    if (!module || module.loaded) return;

    // Check if all dependencies are loaded
    const deps = module.dependencies.map(dep => {
      const depModule = modules[dep];
      return depModule && depModule.loaded ? depModule.exports : null;
    });

    if (deps.some(dep => dep === null)) {
      // Not all dependencies are ready
      return;
    }

    // Load the module
    try {
      if (typeof module.factory === 'function') {
        module.exports = module.factory.apply(null, deps);
      } else {
        module.exports = module.factory;
      }
      module.loaded = true;
      loadedModules.add(name);

      // Notify waiting callbacks
      notifyModuleLoaded(name);

      // Try to load modules that depend on this one
      Object.keys(modules).forEach(modName => {
        if (modules[modName].dependencies.includes(name)) {
          tryLoadModule(modName);
        }
      });
    } catch (error) {
      console.error(`[ERROR] Failed to load module ${name}:`, error);
    }
  }

  /**
   * Register a callback for when a module is loaded
   * @param {string} name - Module name
   * @param {Function} callback - Callback function
   */
  function whenModuleLoaded(name, callback) {
    const module = modules[name];
    if (module && module.loaded) {
      callback(module.exports);
    } else {
      pendingCallbacks.push({ name, callback });
    }
  }

  /**
   * Notify callbacks that a module has been loaded
   * @param {string} name - Module name
   */
  function notifyModuleLoaded(name) {
    const module = modules[name];
    if (!module) return;

    pendingCallbacks.forEach((pending, index) => {
      if (pending.name === name) {
        pending.callback(module.exports);
        pendingCallbacks.splice(index, 1);
      }
    });
  }

  /**
   * Get a loaded module
   * @param {string} name - Module name
   * @returns {*} Module exports or null
   */
  function getModule(name) {
    const module = modules[name];
    return module && module.loaded ? module.exports : null;
  }

  /**
   * Check if a module is loaded
   * @param {string} name - Module name
   * @returns {boolean} True if loaded
   */
  function isModuleLoaded(name) {
    return loadedModules.has(name);
  }

  /**
   * Get all loaded module names
   * @returns {Array} Array of module names
   */
  function getLoadedModules() {
    return Array.from(loadedModules);
  }

  // Create the module loader API
  const moduleLoader = {
    define,
    require,
    getModule,
    isModuleLoaded,
    getLoadedModules
  };

  // Export for different environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = moduleLoader;
  } else if (typeof window !== 'undefined') {
    window.ModuleLoader = moduleLoader;
    // Also expose as AMD-style define/require for compatibility
    window.define = define;
    window.require = require;
  }
})();