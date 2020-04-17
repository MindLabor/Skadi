@echo off

if "%~1"=="" goto run

if "%~1"== "run" (goto run)
if "%~1"== "test" (goto test)
goto end

:run
echo Running Skadi...
node Skadi.js
goto end

:test
echo Running Tests...
nyc npm test && nyc report --reporter=text-lcov | coveralls

:end
