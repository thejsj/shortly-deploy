module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        src: [
          './public/lib/jquery.js',
          './public/lib/underscore.js',
          './public/lib/handlebars.js',
          './public/lib/backbone.js',
          './public/lib/underscore.js',
          './public/client/app.js',
          './public/client/link.js',
          './public/client/links.js',
          './public/client/linkView.js',
          './public/client/linksView.js',
          './public/client/createLinkView.js',
          './public/client/router.js'
        ],
        dest: 'public/dist/production.js',
      },
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          quiet: true
        },
        src: ['test/**/*.js']
      }
    },

    nodemon: {
      dev: {
        script: 'server.js'
      }
    },

    uglify: {
      production: {
        files: {
          'public/dist/production.js': ['public/dist/production.js']
        }
      }
    },

    jshint: {
      files: [
        'public/client/*.js'
      ],
      options: {
        //  force: 'true',
        jshintrc: '.jshintrc',
        ignores: [
          'public/lib/**/*.js',
          'public/dist/*.js'
        ]
      }
    },

    cssmin: {
      production: {
        files: {
          'public/dist/style.min.css': ['public/style.css']
        }
      }
    },

    watch: {
      scripts: {
        files: [
          'public/client/**/*.js',
          'public/lib/**/*.js',
        ],
        tasks: [
          'concat',
          'uglify'
        ]
      },
      css: {
        files: 'public/*.css',
        tasks: ['cssmin']
      }
    },

    shell: {
      prodServer: {}
    },
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-nodemon');

  grunt.registerTask('server-dev', function (target) {
    // Running nodejs in a different process and displaying output on the main console
    var nodemon = grunt.util.spawn({
      cmd: 'grunt',
      grunt: true,
      args: 'nodemon'
    });
    nodemon.stdout.pipe(process.stdout);
    nodemon.stderr.pipe(process.stderr);

    grunt.task.run(['watch']);
  });

  ////////////////////////////////////////////////////
  // Main grunt tasks
  ////////////////////////////////////////////////////

  grunt.registerTask('test', [
    'mochaTest'
  ]);

  grunt.registerTask('build', ['jshint', 'mochaTest', 'concat', 'uglify', 'cssmin']);

  grunt.registerTask('upload', function (n) {
    if (grunt.option('prod')) {
      // add your production server task here
      grunt.task.run(['build']);
    } else {
      grunt.task.run(['server-dev']);
    }
  });

  grunt.registerTask('deploy', [
    'build'
  ]);
};