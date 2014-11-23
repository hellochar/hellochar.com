module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    wiredep: {
      task: {
        src: ['views/index.jade'],
        options: {
          ignorePath: 'views'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-wiredep');

  grunt.registerTask('default', ['wiredep']);
};
